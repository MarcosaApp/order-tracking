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
  Spin,
  Tag,
  Typography,
  Upload,
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
import { BASE_URL } from "../services/api-client";
import { formatTimeAgo } from "../utils/date.utils";
import type { ItemEntity } from "../interfaces/entities";
import {
  useOrders,
  useCreateOrder,
  useOrderItems,
  useCreateItem,
  useUploadImage,
} from "../hooks/useOrders";

export const AdminPage: React.FC = () => {
  const [itemForm] = Form.useForm<ItemEntity>();

  const [openItemModal, setOpenItemModal] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>();
  const [activeItem, setActiveItem] = useState<string>("");

  // React Query hooks
  const { data: orders = [], isLoading: ordersLoading } = useOrders();
  const createOrderMutation = useCreateOrder();
  const { data: items = [] } = useOrderItems(activeItem, !!activeItem);
  const createItemMutation = useCreateItem();
  const uploadImageMutation = useUploadImage();

  const onCreateOrder = async () => {
    await createOrderMutation.mutateAsync();
  };

  const onCreateItem = async (item: ItemEntity) => {
    await createItemMutation.mutateAsync(item);
    setOpenItemModal(false);
    setImageUrl(undefined);
    itemForm.resetFields();
  };

  const onChangeItemCollapse = (key: string | string[]) => {
    const [orderId] = Array.isArray(key) ? key : [key];
    setActiveItem(orderId || "");
  };

  const beforeUpload = (file: File) => {
    const isJpgOrPng = file.type === "image/jpeg" || file.type === "image/png";
    if (!isJpgOrPng) {
      return false;
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      return false;
    }
    return isJpgOrPng && isLt2M;
  };

  const handleChange = async (info: any) => {
    if (info.file.status === "uploading") {
      return;
    }

    if (info.file.status === "done") {
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        setImageUrl(reader.result as string);
      });
      reader.readAsDataURL(info.file.originFileObj);
    }
  };

  const customRequest = async ({ file, onSuccess, onError }: any) => {
    try {
      const data = await uploadImageMutation.mutateAsync(file as File);
      if (onSuccess) {
        onSuccess(data);
      }
    } catch (error) {
      if (onError) {
        onError(error);
      }
    }
  };

  if (ordersLoading) {
    return (
      <Flex justify="center" align="center" style={{ height: "100%" }}>
        <Spin size="large" />
      </Flex>
    );
  }

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
          loading={createOrderMutation.isPending}
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
                              loading: createItemMutation.isPending,
                            }}
                            onCancel={() => {
                              setOpenItemModal(false);
                              setImageUrl(undefined);
                              itemForm.resetFields();
                            }}
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
                                      {uploadImageMutation.isPending ? (
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
