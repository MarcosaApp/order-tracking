import {
  Button,
  Col,
  InputNumber,
  Flex,
  Input,
  Layout,
  Row,
  Select,
  Typography,
  Card,
  Tag,
  Modal,
  Form,
  message,
  Collapse,
  Upload,
  Image,
  type GetProp,
  type UploadProps,
} from "antd";
import "./App.css";
import { Content, Header } from "antd/es/layout/layout";
import Title from "antd/es/typography/Title";
import { useEffect, useState } from "react";
import {
  LoadingOutlined,
  PlusOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { BASE_URL, HttpService } from "./services/http.service";
import { formatTimeAgo } from "./utils/date.utils";
import { ENTITIES } from "./enums";
import Search from "antd/es/input/Search";
import logo from "./assets/logo.jpeg";

const layoutStyle = {
  // backgroundColor: "black",
  overflow: "hidden",
};

const headerStyle: React.CSSProperties = {
  height: "10vh",
  backgroundColor: "black",
};

const contentStyle: React.CSSProperties = {
  textAlign: "center",
  height: "90vh",
};

interface OrderEntity {
  id: string;
  status?: string | undefined;
  createdAt: number;
  updateAt: number;
}

interface ItemEntity {
  id: string;
  voucherId: string;
  orderId: string;
  product: string;
  quantity: number;
  voucherLink?: string;
  status?: string;
  createdAt: number;
  updateAt: number;
}

interface CollectEntity {
  id?: string;
  voucherId: string;
  driver: string;
  truck: string;
  quantity: number;
  createdAt?: number;
  updateAt?: number;
}

interface GetAllOrders {
  items: OrderEntity[];
  cursor?:
    | {
        [key: string]: any;
      }
    | undefined;
}

const httpClient = new HttpService();

function App() {
  const [messageApi, contextHolder] = message.useMessage();

  const [itemForm] = Form.useForm<ItemEntity>();
  const [collectForm] = Form.useForm<CollectEntity>();

  const [orders, setOrders] = useState<OrderEntity[]>([]);
  const [items, setItems] = useState<ItemEntity[]>([]);
  const [collects, setCollects] = useState<CollectEntity[]>([]);

  const [searchedItem, setSearchedItem] = useState<ItemEntity>();

  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [imageUrl, setImageUrl] = useState<string>();

  const { Search: SearchText } = Input;

  useEffect(() => {
    getAllOrders();
  }, []);

  const getAllOrders = async () => {
    const orders = await httpClient.getAll<GetAllOrders>("order", messageApi);
    if (orders) {
      setOrders(orders.items);
    }
  };

  const onCreateOrder = async () => {
    const order = await httpClient.createOrder<OrderEntity>(
      ENTITIES.ORDER,
      messageApi,
    );

    if (order) {
      await getAllOrders();
    }
  };

  const onCreateItem = async (item: ItemEntity) => {
    if (item.orderId) {
      const itemCreated = await httpClient.createEntity<ItemEntity>(
        ENTITIES.ITEM,
        messageApi,
        item,
      );

      if (itemCreated) {
        setItems((prevItems) => [...prevItems, { ...itemCreated }]);

        messageApi.success({
          type: "success",
          content: "Pedido creado exitosamente",
        });
      }
    }

    setOpen(false);
  };

  const onChangeItemCollapse = async (
    key: string | string[],
    orderId: string,
  ) => {
    const [entity] = key;
    if (entity === ENTITIES.ITEM) {
      const itemResult = await httpClient.getEntitiesByOrder<ItemEntity>(
        entity,
        orderId,
        messageApi,
      );

      if (itemResult?.items) {
        setItems(itemResult.items);
      }
    }
  };

  const onChangeCollectCollapse = async (
    key: string | string[],
    itemId: string,
  ) => {
    const [entity] = key;
    if (entity === ENTITIES.COLLECT) {
      const collectsResult = await httpClient.getCollectsByItem<CollectEntity>(
        itemId,
        messageApi,
      );

      if (collectsResult?.items) {
        setCollects(collectsResult.items);
      }
    }
  };

  const onSearch = async (searchValue: string) => {
    setIsLoading(true);

    const searchResult = await httpClient.getEntity<ItemEntity>(
      ENTITIES.ITEM,
      messageApi,
      searchValue,
    );

    setIsLoading(false);
    setSearchedItem(searchResult);
  };

  const onCollectCreated = async (collect: CollectEntity, itemId: string) => {
    const { driver, truck, quantity } = collect;
    const collectCreated = await httpClient.createEntity<CollectEntity>(
      ENTITIES.COLLECT,
      messageApi,
      {
        voucherId: itemId,
        driver,
        truck,
        quantity,
      },
    );

    if (collectCreated) {
      messageApi.success({
        type: "success",
        content: "Recolecta creada exitosamente",
      });

      setCollects((prevItems) => [...prevItems, { ...collectCreated }]);
    }

    setOpen(false);
  };

  type FileType = Parameters<GetProp<UploadProps, "beforeUpload">>[0];

  const beforeUpload = (file: FileType) => {
    const isJpgOrPng = file.type === "image/jpeg" || file.type === "image/png";
    if (!isJpgOrPng) {
      message.error("You can only upload JPG/PNG file!");
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error("Image must smaller than 2MB!");
    }
    return isJpgOrPng && isLt2M;
  };

  const getBase64 = (img: FileType, callback: (url: string) => void) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => callback(reader.result as string));
    reader.readAsDataURL(img);
  };

  const handleChange: UploadProps["onChange"] = (info) => {
    console.log({ info });
    if (info.file.status === "uploading") {
      setIsLoading(true);
      return;
    }

    if (info.file.status === "done") {
      getBase64(info.file.originFileObj as FileType, (url) => {
        setIsLoading(false);
        setImageUrl(url);
      });
    }
  };

  const customRequest: UploadProps["customRequest"] = async ({
    file,
    onSuccess,
    onError,
  }) => {
    if (file instanceof File) {
      const reader = new FileReader();
      reader.readAsDataURL(file);

      reader.onload = async () => {
        const base64Data = reader.result?.toString().split(",")[1];

        const payload = {
          imageBody: base64Data,
          fileName: file.name,
          contentType: file.type,
        };

        try {
          const response = await fetch(`${BASE_URL}/manager/image/upload`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          });
          const data = await response.json();
          if (onSuccess) {
            onSuccess(data);
          }
          message.success(`${file.name} uploaded successfully!`);
        } catch (error) {
          console.error("Upload error:", error);
          if (onError) {
            // onError({});
          }
          message.error(`${file.name} upload failed.`);
        }
      };

      reader.onerror = (error) => {
        // onError(error);
        message.error(`File reading failed: ${error}`);
      };
    }
  };

  const isAdmin = true;

  return (
    <Row>
      <Col xl={8} md={6} xs={24} style={{ background: "#8c8c8c" }}></Col>
      <Col xl={8} md={12} xs={24}>
        <Layout style={layoutStyle}>
          <>{contextHolder}</>
          <Header style={headerStyle}>
            <Flex justify="center" align="center" style={{ height: "100%" }}>
              <Image src={logo} height={"inherit"}></Image>
              {/* <Title level={4} style={{ margin: 0 }}>
                CONTROL DE ORDENES Y ENTREGAS
              </Title> */}
            </Flex>
          </Header>
          <Content style={contentStyle}>
            {isAdmin ? (
              <>
                <Flex
                  align="start"
                  justify={"center"}
                  vertical
                  style={{
                    height: "10%",
                    padding: "12px",
                  }}
                >
                  <Button
                    type="primary"
                    htmlType="submit"
                    style={{ width: "100%" }}
                    onClick={onCreateOrder}
                  >
                    CREAR ORDEN
                  </Button>
                </Flex>

                <Flex
                  className="hide-scrollbar"
                  vertical
                  gap="small"
                  style={{
                    overflow: "scroll",
                    height: "90%",
                    padding: "8px",
                    background: "black",
                  }}
                >
                  {orders.length ? (
                    orders.map((order) => (
                      <Card title={order.id} id={order.id} key={order.id}>
                        <Flex gap={"middle"} vertical>
                          <Flex justify={"space-between"}>
                            <Flex gap={"middle"}>
                              <Typography.Text>Estado:</Typography.Text>
                              <Tag key={"red"} color={"red"} variant="solid">
                                {order.status}
                              </Tag>
                            </Flex>

                            <Typography.Text>
                              {formatTimeAgo(order.createdAt * 1000)}
                            </Typography.Text>
                          </Flex>
                          <Collapse
                            accordion
                            items={[
                              {
                                key: "item",
                                label: "Pedidos",
                                children: (
                                  <Flex gap="middle" vertical>
                                    <Button
                                      type="primary"
                                      style={{
                                        width: "100%",
                                        marginBottom: 10,
                                      }}
                                      onClick={() => setOpen(true)}
                                    >
                                      AGREGAR
                                    </Button>
                                    <Modal
                                      open={open}
                                      title="Crear pedido"
                                      okText="Crear"
                                      cancelText="Cancelar"
                                      okButtonProps={{
                                        autoFocus: true,
                                        htmlType: "submit",
                                      }}
                                      onCancel={() => setOpen(false)}
                                      destroyOnHidden
                                      modalRender={(dom) => (
                                        <Form
                                          autoComplete="off"
                                          layout="vertical"
                                          form={itemForm}
                                          name="item_form"
                                          initialValues={{ modifier: "public" }}
                                          clearOnDestroy
                                          onFinish={(values) => {
                                            console.log({ values });
                                            onCreateItem({
                                              ...values,
                                              orderId: order.id,
                                            });
                                          }}
                                        >
                                          {dom}
                                        </Form>
                                      )}
                                    >
                                      <Flex justify={"space-between"}>
                                        <Form.Item
                                          name="voucherId"
                                          label="Comprobante"
                                          layout="vertical"
                                          rules={[
                                            {
                                              required: true,
                                              message: "Campo requerido",
                                            },
                                          ]}
                                          style={{ width: "60%" }}
                                        >
                                          <Input name="reference"></Input>
                                        </Form.Item>

                                        <Form.Item name="voucherLink">
                                          <Upload
                                            maxCount={1}
                                            multiple={false}
                                            name="voucher"
                                            listType={"picture-card"}
                                            className="avatar-uploader"
                                            beforeUpload={beforeUpload}
                                            onChange={handleChange}
                                            action={`${BASE_URL}/manager/image/upload`}
                                            showUploadList={false}
                                            customRequest={customRequest}
                                          >
                                            {imageUrl ? (
                                              <img
                                                draggable={false}
                                                src={imageUrl}
                                                alt="avatar"
                                                style={{ width: "100%" }}
                                              />
                                            ) : (
                                              <button
                                                style={{
                                                  border: 0,
                                                  background: "none",
                                                }}
                                                type="button"
                                              >
                                                {isLoading ? (
                                                  <LoadingOutlined />
                                                ) : (
                                                  <PlusOutlined />
                                                )}
                                                <div style={{ marginTop: 8 }}>
                                                  Subir
                                                </div>
                                              </button>
                                            )}
                                          </Upload>
                                        </Form.Item>
                                      </Flex>

                                      <Form.Item
                                        name="quantity"
                                        label="Cantidad"
                                        rules={[
                                          {
                                            required: true,
                                            message: "Campo requerido",
                                          },
                                        ]}
                                      >
                                        <InputNumber
                                          type="number"
                                          style={{ width: "100%" }}
                                        />
                                      </Form.Item>

                                      <Form.Item
                                        label="Producto:"
                                        name="product"
                                        layout="vertical"
                                        rules={[
                                          {
                                            required: true,
                                            message: "Campo requerido",
                                          },
                                        ]}
                                      >
                                        <Select
                                          options={[
                                            { value: "Block", label: "Block" },
                                            {
                                              value: "Cemento",
                                              label: "Cemento",
                                            },
                                          ]}
                                        ></Select>
                                      </Form.Item>
                                    </Modal>

                                    {items.map((item) => (
                                      <Collapse
                                        accordion
                                        size={"small"}
                                        key={item.id}
                                        items={[
                                          {
                                            key: item?.voucherId,
                                            label: `Comprobante - ${item?.voucherId}`,
                                            children: (
                                              <Flex vertical gap="small">
                                                <Flex gap={"middle"}>
                                                  <Typography.Text>
                                                    {formatTimeAgo(
                                                      item.createdAt * 1000,
                                                    )}
                                                  </Typography.Text>
                                                </Flex>
                                                <Flex gap={"middle"}>
                                                  <Typography.Text>
                                                    Estado:
                                                  </Typography.Text>
                                                  <Tag
                                                    key={"red"}
                                                    color={"red"}
                                                    variant="solid"
                                                  >
                                                    {item.status}
                                                  </Tag>
                                                </Flex>
                                                <Flex gap="middle">
                                                  <Typography.Text>
                                                    Producto:
                                                  </Typography.Text>
                                                  <Typography.Text strong>
                                                    {item.product}
                                                  </Typography.Text>
                                                </Flex>
                                                <Flex>
                                                  <Typography.Text>
                                                    Cantidad:
                                                  </Typography.Text>
                                                </Flex>
                                                <Flex
                                                  justify="center"
                                                  style={{ width: "100%" }}
                                                >
                                                  <Title
                                                    level={2}
                                                    style={{
                                                      margin: 0,
                                                      padding: 10,
                                                    }}
                                                  >
                                                    {item.quantity}/0
                                                  </Title>
                                                </Flex>
                                              </Flex>
                                            ),
                                          },
                                        ]}
                                      ></Collapse>
                                    ))}
                                  </Flex>
                                ),
                              },
                            ]}
                            onChange={(key) => {
                              onChangeItemCollapse(key, order.id);
                            }}
                          />
                        </Flex>
                      </Card>
                    ))
                  ) : (
                    <Flex></Flex>
                  )}
                </Flex>
              </>
            ) : (
              <>
                <Flex
                  align="center"
                  justify={"space-between"}
                  style={{ height: "10%", padding: "12px" }}
                >
                  <SearchText
                    allowClear
                    placeholder="comprobante"
                    enterButton
                    loading={isLoading}
                    onSearch={onSearch}
                  />
                </Flex>

                <Flex
                  className="hide-scrollbar"
                  vertical
                  gap="small"
                  style={{
                    overflow: "scroll",
                    height: "90%",
                    padding: "8px",
                    // background: "green",
                  }}
                >
                  {searchedItem ? (
                    <Card
                      title={`Comprobante - ${searchedItem?.voucherId}`}
                      id={searchedItem.id}
                      key={searchedItem.id}
                    >
                      <Flex gap={"middle"} vertical>
                        <Flex justify={"space-between"}>
                          <Flex gap={"middle"}>
                            <Typography.Text>Estado:</Typography.Text>
                            <Tag key={"red"} color={"red"} variant="solid">
                              {searchedItem.status}
                            </Tag>
                          </Flex>

                          <Typography.Text>
                            {formatTimeAgo(searchedItem.createdAt * 1000)}
                          </Typography.Text>
                        </Flex>

                        <Collapse
                          accordion
                          items={[
                            {
                              key: "collect",
                              label: "Recolectas",
                              children: (
                                <Flex gap="middle" vertical>
                                  <Button
                                    type="primary"
                                    style={{
                                      width: "100%",
                                      marginBottom: 10,
                                    }}
                                    onClick={() => setOpen(true)}
                                  >
                                    AGREGAR
                                  </Button>
                                  <Modal
                                    open={open}
                                    title="Crear recolecta"
                                    okText="Crear"
                                    cancelText="Cancelar"
                                    okButtonProps={{
                                      autoFocus: true,
                                      htmlType: "submit",
                                    }}
                                    onCancel={() => setOpen(false)}
                                    destroyOnHidden
                                    modalRender={(dom) => (
                                      <Form
                                        autoComplete="off"
                                        layout="vertical"
                                        form={collectForm}
                                        name="collect_form"
                                        initialValues={{ modifier: "public" }}
                                        clearOnDestroy
                                        onFinish={(values) => {
                                          onCollectCreated(
                                            values,
                                            searchedItem.id,
                                          );
                                        }}
                                      >
                                        {dom}
                                      </Form>
                                    )}
                                  >
                                    <Form.Item
                                      name="driver"
                                      label="Piloto"
                                      layout="vertical"
                                      rules={[
                                        {
                                          required: true,
                                          message: "Campo requerido",
                                        },
                                      ]}
                                    >
                                      <Input name="reference"></Input>
                                    </Form.Item>

                                    <Form.Item
                                      name="truck"
                                      label="Camion"
                                      layout="vertical"
                                      rules={[
                                        {
                                          required: true,
                                          message: "Campo requerido",
                                        },
                                      ]}
                                    >
                                      <Input name="reference"></Input>
                                    </Form.Item>

                                    <Form.Item
                                      name="quantity"
                                      label="Cantidad"
                                      rules={[
                                        {
                                          required: true,
                                          message: "Campo requerido",
                                        },
                                      ]}
                                    >
                                      <InputNumber
                                        type="number"
                                        style={{ width: "100%" }}
                                      />
                                    </Form.Item>
                                  </Modal>

                                  {collects.map((collect, index) => (
                                    <Collapse
                                      // bordered={false}
                                      accordion
                                      size={"small"}
                                      key={collect.id}
                                      items={[
                                        {
                                          key: collect.voucherId,
                                          label: `Recolecta - ${index + 1}`,
                                          children: (
                                            <Flex vertical gap="small">
                                              <Flex gap={"middle"}>
                                                <Typography.Text>
                                                  {formatTimeAgo(
                                                    collect.createdAt! * 1000,
                                                  )}
                                                </Typography.Text>
                                              </Flex>
                                              <Flex gap={"middle"}>
                                                <Typography.Text>
                                                  Piloto:
                                                </Typography.Text>
                                                <Tag
                                                  key={"red"}
                                                  color={"red"}
                                                  variant="solid"
                                                >
                                                  {collect.driver}
                                                </Tag>
                                              </Flex>
                                              <Flex gap="middle">
                                                <Typography.Text>
                                                  Camion:
                                                </Typography.Text>
                                                <Typography.Text strong>
                                                  {collect.truck}
                                                </Typography.Text>
                                              </Flex>
                                              <Flex>
                                                <Typography.Text>
                                                  Cantidad:
                                                </Typography.Text>
                                              </Flex>
                                              <Flex
                                                justify="center"
                                                style={{ width: "100%" }}
                                              >
                                                <Title
                                                  level={2}
                                                  style={{
                                                    margin: 0,
                                                    padding: 10,
                                                  }}
                                                >
                                                  {collect.quantity}
                                                </Title>
                                              </Flex>
                                            </Flex>
                                          ),
                                        },
                                      ]}
                                    ></Collapse>
                                  ))}
                                </Flex>
                              ),
                            },
                            { key: "deliveries", label: "Entregas" },
                          ]}
                          onChange={(key) => {
                            onChangeCollectCollapse(key, searchedItem.id);
                          }}
                        />
                      </Flex>
                    </Card>
                  ) : (
                    <></>
                  )}
                </Flex>
              </>
            )}
          </Content>
        </Layout>
      </Col>
      <Col xl={8} md={6} xs={24} style={{ background: "#8c8c8c" }}></Col>
    </Row>
  );
}

export default App;
