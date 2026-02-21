import {
  Button,
  Card,
  Collapse,
  Flex,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Tag,
  Typography,
  Upload,
  message,
  type GetProp,
  type UploadProps,
} from "antd";
import Title from "antd/es/typography/Title";
import { useState } from "react";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
  PlusOutlined,
  SyncOutlined,
} from "@ant-design/icons";
import { BASE_URL, HttpService } from "../services/http.service";
import { formatTimeAgo } from "../utils/date.utils";
import { ENTITIES } from "../enums";
import type { ItemEntity, OrderEntity } from "../interfaces/entities";

type FileType = Parameters<GetProp<UploadProps, "beforeUpload">>[0];

interface AdminPageProps {
  messageApi: ReturnType<typeof message.useMessage>[0];
}

const httpClient = new HttpService();

export const AdminPage: React.FC<AdminPageProps> = ({ messageApi }) => {
  const [itemForm] = Form.useForm<ItemEntity>();

  const [orders, setOrders] = useState<OrderEntity[]>([]);
  const [items, setItems] = useState<ItemEntity[]>([]);

  const [openItemModal, setOpenItemModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>();
  const [activeItem, setActiveItem] = useState<string>("");

  const getAllOrders = async () => {
    const orders = await httpClient.getAll<{ items: OrderEntity[] }>(
      "order",
      messageApi
    );
    if (orders) {
      setOrders(orders.items);
    }
  };

  useState(() => {
    getAllOrders();
  });

  const onCreateOrder = async () => {
    const order = await httpClient.createOrder<OrderEntity>(
      ENTITIES.ORDER,
      messageApi
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
        item
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
      messageApi
    );

    if (itemResult?.items) {
      setItems(itemResult.items);
    }
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
            <Card
              title={`ORDEN - ${order.createdAt.toString(36).toUpperCase()}`}
              id={order.id}
              key={order.id}
            >
              <Flex gap={"middle"} vertical>
                <Flex justify={"space-between"}>
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
                                      <div style={{ marginTop: 8 }}>Subir</div>
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
                                        <Flex justify={"space-between"}>
                                          <Flex gap={"middle"}>
                                            <Typography.Text>
                                              Estado:
                                            </Typography.Text>
                                            {item.status === "PENDIENTE" && (
                                              <Tag
                                                key={"error"}
                                                color={"error"}
                                                icon={<CloseCircleOutlined />}
                                                variant="solid"
                                              >
                                                {item.status}
                                              </Tag>
                                            )}

                                            {item.status === "EN RUTA" && (
                                              <Tag
                                                key={"processing"}
                                                color={"processing"}
                                                icon={<SyncOutlined />}
                                                variant="solid"
                                              >
                                                {item.status}
                                              </Tag>
                                            )}

                                            {item.status === "RECOLECTADO" && (
                                              <Tag
                                                key={"success"}
                                                color={"success"}
                                                icon={<CheckCircleOutlined />}
                                                variant="solid"
                                              >
                                                {item.status}
                                              </Tag>
                                            )}
                                          </Flex>

                                          <Typography.Text>
                                            {formatTimeAgo(item.createdAt * 1000)}
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
                                            {item.quantity}/{item.collected}
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
  );
};
