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
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
  PlusOutlined,
  SyncOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { BASE_URL, HttpService } from "./services/http.service";
import { formatTimeAgo } from "./utils/date.utils";
import { ENTITIES } from "./enums";
import Search from "antd/es/input/Search";
import logo from "./assets/logo.jpeg";
import type {
  CollectEntity,
  DeliveryEntity,
  ItemEntity,
  OrderEntity,
} from "./interfaces/entities";

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

interface GetAllOrders {
  items: OrderEntity[];
  cursor?:
    | {
        [key: string]: any;
      }
    | undefined;
}

type FileType = Parameters<GetProp<UploadProps, "beforeUpload">>[0];

const httpClient = new HttpService();

function App() {
  const [messageApi, contextHolder] = message.useMessage();

  const [itemForm] = Form.useForm<ItemEntity>();
  const [collectForm] = Form.useForm<CollectEntity>();
  const [deliveryForm] = Form.useForm<DeliveryEntity>();

  const [orders, setOrders] = useState<OrderEntity[]>([]);
  const [items, setItems] = useState<ItemEntity[]>([]);
  const [collects, setCollects] = useState<CollectEntity[]>([]);
  const [deliveries, setDeliveries] = useState<CollectEntity[]>([]);

  const [searchedItem, setSearchedItem] = useState<ItemEntity>();

  const [openItemModal, setOpenItemModal] = useState(false);
  const [openCollectModal, setOpenCollectModal] = useState(false);
  const [openDeliveryModal, setOpenDeliveryModal] = useState(false);

  const [isLoading, setIsLoading] = useState(false);

  const [imageUrl, setImageUrl] = useState<string>();
  const [activeItem, setActiveItem] = useState<string>("");

  const [isAdmin, setIsAdmin] = useState(true);

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

    setOpenItemModal(false);
  };

  const onChangeItemCollapse = async (key: string | string[]) => {
    const [orderId] = key;

    if (!orderId) {
      setActiveItem("");
      return;
    }

    setActiveItem(orderId);

    const itemResult = await httpClient.getItemsByOrder<ItemEntity>(
      orderId,
      messageApi,
    );

    if (itemResult?.items) {
      setItems(itemResult.items);
    }
  };

  const onChangeDriverCollapse = async (
    key: string | string[],
    itemId: string,
  ) => {
    const [entity] = key;

    if (entity) {
      if (entity === ENTITIES.COLLECT) {
        const collectsResult =
          await httpClient.getCollectsByItem<CollectEntity>(itemId, messageApi);

        if (collectsResult?.items) {
          setCollects(collectsResult.items);
        }
      }

      if (entity === ENTITIES.DELIVERY) {
        const deliveryResult =
          await httpClient.getDeliveriesByItem<DeliveryEntity>(
            itemId,
            messageApi,
          );

        if (deliveryResult?.items) {
          setDeliveries(deliveryResult.items);
        }
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

  const onCreateCollect = async (collect: CollectEntity, voucherId: string) => {
    const { driver, truck, quantity } = collect;

    const collectCreated = await httpClient.createCollect(messageApi, {
      voucherId,
      driver,
      truck,
      quantity,
    });

    if (collectCreated) {
      if (collectCreated.item && collectCreated.collect) {
        messageApi.success({
          type: "success",
          content: "Recolecta creada exitosamente",
        });

        setSearchedItem(collectCreated.item);
        setCollects((prevItems) => [
          ...prevItems,
          { ...collectCreated.collect },
        ]);
      }
    }

    setOpenCollectModal(false);
  };

  const onCreateDelivery = async (delivery: DeliveryEntity, itemId: string) => {
    const { customer, driver, truck, quantity } = delivery;

    const deliveryCreated = await httpClient.createEntity<DeliveryEntity>(
      ENTITIES.DELIVERY,
      messageApi,
      {
        voucherId: itemId,
        customer,
        driver,
        truck,
        quantity,
      },
    );

    if (deliveryCreated) {
      messageApi.success({
        type: "success",
        content: "Entrega creada exitosamente",
      });

      setDeliveries((prevItems) => [...prevItems, { ...deliveryCreated }]);
    }

    setOpenDeliveryModal(false);
  };

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

  return (
    <Row>
      <Col xl={8} md={6} xs={24} style={{ background: "#8c8c8c" }}></Col>
      <Col xl={8} md={12} xs={24}>
        <Layout style={layoutStyle}>
          <>{contextHolder}</>
          <Header style={headerStyle}>
            <Flex justify="center" align="center" style={{ height: "100%" }}>
              <Image src={logo} height={"inherit"}></Image>
              <Button
                type={"primary"}
                onClick={() => {
                  setIsAdmin(!isAdmin);
                }}
              >
                CAMBIAR ROL
              </Button>
            </Flex>
          </Header>
          <Content style={contentStyle}>
            {isAdmin ? (
              <>
                {/* PANTALLA ADMINISTRADORES */}
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
                      <Card
                        title={`ORDEN - ${order.createdAt.toString(36).toUpperCase()}`}
                        id={order.id}
                        key={order.id}
                      >
                        <Flex gap={"middle"} vertical>
                          <Flex justify={"space-between"}>
                            <Flex gap={"middle"}>
                              <Typography.Text>Estado:</Typography.Text>
                              {order.status === "PENDIENTE" && (
                                <Tag
                                  key={"error"}
                                  color={"error"}
                                  icon={<CloseCircleOutlined />}
                                  variant="solid"
                                >
                                  {order.status}
                                </Tag>
                              )}

                              {order.status === "EN RUTA" && (
                                <Tag
                                  key={"processing"}
                                  color={"processing"}
                                  icon={<SyncOutlined />}
                                  variant="solid"
                                >
                                  {order.status}
                                </Tag>
                              )}

                              {order.status === "RECOLECTADO" && (
                                <Tag
                                  key={"success"}
                                  color={"success"}
                                  icon={<CheckCircleOutlined />}
                                  variant="solid"
                                >
                                  {order.status}
                                </Tag>
                              )}
                            </Flex>

                            <Typography.Text>
                              {formatTimeAgo(order.createdAt * 1000)}
                            </Typography.Text>
                          </Flex>
                          <Collapse
                            accordion
                            key={`${order.id}`}
                            activeKey={activeItem}
                            items={[
                              {
                                key: `${order.id}`,
                                label: "Pedidos",
                                children: (
                                  <Flex gap="middle" vertical>
                                    <Button
                                      type="primary"
                                      style={{
                                        width: "100%",
                                        marginBottom: 10,
                                      }}
                                      onClick={() => {
                                        setOpenItemModal(true);
                                      }}
                                    >
                                      AGREGAR
                                    </Button>
                                    <Modal
                                      open={openItemModal}
                                      destroyOnHidden
                                      title="Crear pedido"
                                      okText="Crear"
                                      cancelText="Cancelar"
                                      okButtonProps={{
                                        autoFocus: true,
                                        htmlType: "submit",
                                      }}
                                      onCancel={() => setOpenItemModal(false)}
                                      modalRender={(dom) => (
                                        <Form
                                          autoComplete="off"
                                          layout="vertical"
                                          form={itemForm}
                                          name={`item_form_order_${order.id}`}
                                          initialValues={{ modifier: "public" }}
                                          clearOnDestroy
                                          onFinish={(values) => {
                                            onCreateItem({
                                              ...values,
                                              orderId: activeItem,
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
                                            {
                                              value: "Monocapa Gris",
                                              label: "Monocapa Gris",
                                            },
                                            {
                                              value: "Monocapa Blanco",
                                              label: "Monocapa Blanco",
                                            },
                                            {
                                              value: "Horcalsa",
                                              label: "Horcalsa",
                                            },
                                            {
                                              value: "Montaña",
                                              label: "Montaña",
                                            },
                                            {
                                              value: "Cemento Ariblock",
                                              label: "Cemento Ariblock",
                                            },
                                            {
                                              value: "Monocapa Extraliso",
                                              label: "Monocapa Extraliso",
                                            },
                                            {
                                              value: "Monocapa Ultraliso",
                                              label: "Monocapa Ultraliso",
                                            },
                                          ]}
                                        ></Select>
                                      </Form.Item>
                                    </Modal>

                                    {items.length > 0 && (
                                      <Collapse
                                        accordion
                                        size={"small"}
                                        key={"items"}
                                        items={(() => {
                                          return items.map((item) => {
                                            return {
                                              key: item.id,
                                              label: `Comprobante - ${item?.voucherId}`,
                                              children: (
                                                <Flex
                                                  vertical
                                                  gap="small"
                                                  key={item.id}
                                                  id={item.id}
                                                >
                                                  <Flex
                                                    justify={"space-between"}
                                                  >
                                                    <Flex gap={"middle"}>
                                                      <Typography.Text>
                                                        Estado:
                                                      </Typography.Text>
                                                      {item.status ===
                                                        "PENDIENTE" && (
                                                        <Tag
                                                          key={"error"}
                                                          color={"error"}
                                                          icon={
                                                            <CloseCircleOutlined />
                                                          }
                                                          variant="solid"
                                                        >
                                                          {item.status}
                                                        </Tag>
                                                      )}

                                                      {item.status ===
                                                        "EN RUTA" && (
                                                        <Tag
                                                          key={"processing"}
                                                          color={"processing"}
                                                          icon={
                                                            <SyncOutlined />
                                                          }
                                                          variant="solid"
                                                        >
                                                          {item.status}
                                                        </Tag>
                                                      )}

                                                      {item.status ===
                                                        "RECOLECTADO" && (
                                                        <Tag
                                                          key={"success"}
                                                          color={"success"}
                                                          icon={
                                                            <CheckCircleOutlined />
                                                          }
                                                          variant="solid"
                                                        >
                                                          {item.status}
                                                        </Tag>
                                                      )}
                                                    </Flex>

                                                    <Typography.Text>
                                                      {formatTimeAgo(
                                                        item.createdAt * 1000,
                                                      )}
                                                    </Typography.Text>
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
                                                      {item.quantity}/
                                                      {item.collected}
                                                    </Title>
                                                  </Flex>
                                                </Flex>
                                              ),
                                            };
                                          });
                                        })()}
                                      ></Collapse>
                                    )}
                                  </Flex>
                                ),
                              },
                            ]}
                            onChange={(key) => {
                              onChangeItemCollapse(key);
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
                {/* PANTALLA DE PILOTOS */}
                <Flex
                  align="center"
                  justify={"space-between"}
                  style={{ height: "10%", padding: "12px" }}
                >
                  <SearchText
                    enterButton
                    // placeholder="comprobante"
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
                    background: "black",
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
                            {searchedItem.status === "PENDIENTE" && (
                              <Tag
                                key={"error"}
                                color={"error"}
                                icon={<CloseCircleOutlined />}
                                variant="solid"
                              >
                                {searchedItem.status}
                              </Tag>
                            )}

                            {searchedItem.status === "EN RUTA" && (
                              <Tag
                                key={"processing"}
                                color={"processing"}
                                icon={<SyncOutlined />}
                                variant="solid"
                              >
                                {searchedItem.status}
                              </Tag>
                            )}

                            {searchedItem.status === "RECOLECTADO" && (
                              <Tag
                                key={"success"}
                                color={"success"}
                                icon={<CheckCircleOutlined />}
                                variant="solid"
                              >
                                {searchedItem.status}
                              </Tag>
                            )}
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
                                    onClick={() => setOpenCollectModal(true)}
                                  >
                                    AGREGAR
                                  </Button>
                                  <Modal
                                    open={openCollectModal}
                                    title="Crear recolecta"
                                    okText="Crear"
                                    cancelText="Cancelar"
                                    okButtonProps={{
                                      autoFocus: true,
                                      htmlType: "submit",
                                    }}
                                    onCancel={() => setOpenCollectModal(false)}
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
                                          onCreateCollect(
                                            values,
                                            searchedItem.voucherId,
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

                                  {collects.length > 0 && (
                                    <Collapse
                                      accordion
                                      size={"small"}
                                      key={"collects"}
                                      items={(() => {
                                        return collects.map((collect) => {
                                          return {
                                            key: collect.id,
                                            label: `${collect.createdAt?.toString(36).toUpperCase()}`,
                                            children: (
                                              <Flex
                                                vertical
                                                gap="small"
                                                key={collect.id}
                                                id={collect.id}
                                              >
                                                <Flex justify={"space-between"}>
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

                                                  <Typography.Text>
                                                    {formatTimeAgo(
                                                      collect.createdAt! * 1000,
                                                    )}
                                                  </Typography.Text>
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
                                          };
                                        });
                                      })()}
                                    ></Collapse>
                                  )}
                                </Flex>
                              ),
                            },
                            {
                              key: "delivery",
                              label: "Entregas",
                              children: (
                                <Flex gap="middle" vertical>
                                  <Button
                                    type="primary"
                                    style={{
                                      width: "100%",
                                      marginBottom: 10,
                                    }}
                                    onClick={() => setOpenDeliveryModal(true)}
                                  >
                                    AGREGAR
                                  </Button>
                                  <Modal
                                    open={openDeliveryModal}
                                    title="Crear Entrega"
                                    okText="Crear"
                                    cancelText="Cancelar"
                                    okButtonProps={{
                                      autoFocus: true,
                                      htmlType: "submit",
                                    }}
                                    onCancel={() => setOpenDeliveryModal(false)}
                                    destroyOnHidden
                                    modalRender={(dom) => (
                                      <Form
                                        autoComplete="off"
                                        layout="vertical"
                                        form={deliveryForm}
                                        name="delivery_form"
                                        initialValues={{ modifier: "public" }}
                                        clearOnDestroy
                                        onFinish={(values) => {
                                          onCreateDelivery(
                                            values,
                                            searchedItem.voucherId,
                                          );
                                        }}
                                      >
                                        {dom}
                                      </Form>
                                    )}
                                  >
                                    <Form.Item
                                      name="customer"
                                      label="Cliente"
                                      layout="vertical"
                                      rules={[
                                        {
                                          required: true,
                                          message: "Campo requerido",
                                        },
                                      ]}
                                      style={{ width: "100%" }}
                                    >
                                      <Input name="customer"></Input>
                                    </Form.Item>

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
                                      <Input name="driver"></Input>
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
                                      <Input name="truck"></Input>
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

                                  {deliveries.length > 0 && (
                                    <Collapse
                                      accordion
                                      size={"small"}
                                      key={"deliveries"}
                                      items={(() => {
                                        return deliveries.map((collect) => {
                                          return {
                                            key: collect.id,
                                            label: `${collect.createdAt?.toString(36).toUpperCase()}`,
                                            children: (
                                              <Flex
                                                vertical
                                                gap="small"
                                                key={collect.id}
                                                id={collect.id}
                                              >
                                                <Flex justify={"space-between"}>
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

                                                  <Typography.Text>
                                                    {formatTimeAgo(
                                                      collect.createdAt! * 1000,
                                                    )}
                                                  </Typography.Text>
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
                                          };
                                        });
                                      })()}
                                    ></Collapse>
                                  )}
                                </Flex>
                              ),
                            },
                          ]}
                          onChange={(key) => {
                            onChangeDriverCollapse(key, searchedItem.voucherId);
                          }}
                        />
                      </Flex>
                    </Card>
                  ) : (
                    <Flex></Flex>
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
