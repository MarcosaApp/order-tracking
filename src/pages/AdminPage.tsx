import {
  Button,
  Card,
  Collapse,
  Flex,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Segmented,
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
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  LoadingOutlined,
  PlusOutlined,
  SyncOutlined,
} from "@ant-design/icons";
import { BASE_URL } from "../services/api-client";
import { formatTimeAgo } from "../utils/date.utils";
import type { ItemEntity, OrderEntity } from "../interfaces/entities";
import {
  useOrders,
  useCreateOrder,
  useOrderItems,
  useCreateItem,
  useUploadImage,
  useGetImageSignedUrl,
  useAllItems,
  useDeleteOrder,
  useUpdateOrder,
  useDeleteItem,
  useUpdateItem,
} from "../hooks/useOrders";

export const AdminPage: React.FC = () => {
  const [itemForm] = Form.useForm<ItemEntity>();
  const [editOrderForm] = Form.useForm<Partial<OrderEntity>>();
  const [editItemForm] = Form.useForm<Partial<ItemEntity>>();

  const [openItemModal, setOpenItemModal] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>();
  const [activeItem, setActiveItem] = useState<string>("");
  const [openEditOrderModal, setOpenEditOrderModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState<OrderEntity | null>(null);
  const [openEditItemModal, setOpenEditItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ItemEntity | null>(null);
  const [voucherImageUrl, setVoucherImageUrl] = useState<string | undefined>();
  const [activeView, setActiveView] = useState<"orders" | "items">("orders");

  // React Query hooks
  const { data: orders = [], isLoading: ordersLoading } = useOrders();
  const createOrderMutation = useCreateOrder();
  const {
    data: allItemsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: allItemsLoading,
  } = useAllItems(activeView === "items");
  const allItems = allItemsData?.pages.flatMap((p) => p.items ?? []) ?? [];
  const { data: items = [] } = useOrderItems(activeItem, !!activeItem);
  const createItemMutation = useCreateItem();
  const uploadImageMutation = useUploadImage();
  const getImageSignedUrlMutation = useGetImageSignedUrl();
  const deleteOrderMutation = useDeleteOrder();
  const updateOrderMutation = useUpdateOrder();
  const deleteItemMutation = useDeleteItem();
  const updateItemMutation = useUpdateItem();

  const onCreateOrder = async () => {
    await createOrderMutation.mutateAsync();
  };

  const onCreateItem = async (item: ItemEntity) => {
    await createItemMutation.mutateAsync(item);
    setOpenItemModal(false);
    setImageUrl(undefined);
    itemForm.resetFields();
  };

  const onDeleteOrder = async (id: string) => {
    await deleteOrderMutation.mutateAsync(id);
  };

  const onUpdateOrder = async (values: Partial<OrderEntity>) => {
    if (!editingOrder) return;
    await updateOrderMutation.mutateAsync({
      id: editingOrder.id,
      data: values,
    });
    setOpenEditOrderModal(false);
    setEditingOrder(null);
    editOrderForm.resetFields();
  };

  const onDeleteItem = async (voucherId: string, orderId: string) => {
    await deleteItemMutation.mutateAsync({ voucherId, orderId });
  };

  const onOpenEditItem = (item: ItemEntity) => {
    setEditingItem(item);
    editItemForm.setFieldsValue({
      voucherId: item.voucherId,
      product: item.product,
      quantity: item.quantity,
      status: item.status,
    });
    setOpenEditItemModal(true);
  };

  const onUpdateItem = async (values: Partial<ItemEntity>) => {
    if (!editingItem) return;
    await updateItemMutation.mutateAsync({
      voucherId: editingItem.voucherId,
      orderId: editingItem.orderId,
      data: values,
    });
    setOpenEditItemModal(false);
    setEditingItem(null);
    editItemForm.resetFields();
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

  const handleChange = (info: any) => {
    if (info.file.status === "done") {
      const key = info.file.response;
      itemForm.setFieldValue("voucherKey", key);
      const reader = new FileReader();
      reader.onload = () => setImageUrl(reader.result as string);
      reader.readAsDataURL(info.file.originFileObj);
    }
  };

  const onViewVoucherImage = async (key: string) => {
    const url = await getImageSignedUrlMutation.mutateAsync(key);
    setVoucherImageUrl(url);
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
        vertical
        gap="middle"
        style={{ height: "15%", padding: "20px 0px" }}
      >
        <Segmented
          block
          value={activeView}
          onChange={(v) => setActiveView(v as "orders" | "items")}
          options={[
            { label: "ÓRDENES", value: "orders" },
            { label: "PEDIDOS", value: "items" },
          ]}
        />
        {activeView === "orders" && (
          <Button
            type="primary"
            style={{ width: "100%" }}
            onClick={onCreateOrder}
            loading={createOrderMutation.isPending}
          >
            CREAR ORDEN
          </Button>
        )}
      </Flex>

      <Flex
        className="hide-scrollbar"
        vertical
        gap="middle"
        style={{
          overflow: "scroll",
          height: "85%",
          background: "#0d1117",
          padding: "0",
        }}
      >
        {activeView === "items" ? (
          <>
            {allItemsLoading ? (
              <Flex justify="center" align="center" style={{ flex: 1 }}>
                <Spin size="large" />
              </Flex>
            ) : allItems.length > 0 ? (
              <>
                {allItems.map((item) => (
                  <Card
                    key={item.id}
                    size="small"
                    title={`Comprobante - ${item.voucherId}`}
                    extra={
                      <Flex gap="small">
                        {item.voucherKey && (
                          <Button
                            size="small"
                            icon={<EyeOutlined />}
                            loading={
                              getImageSignedUrlMutation.isPending &&
                              getImageSignedUrlMutation.variables === item.voucherKey
                            }
                            onClick={() => onViewVoucherImage(item.voucherKey!)}
                          />
                        )}
                      </Flex>
                    }
                  >
                    <Flex vertical gap="small">
                      <Flex justify="space-between">
                        <Flex gap="middle">
                          <Typography.Text>Estado:</Typography.Text>
                          {item.status === "PENDIENTE" && (
                            <Tag color="error" icon={<CloseCircleOutlined />} variant="solid">
                              {item.status}
                            </Tag>
                          )}
                          {item.status === "EN RUTA" && (
                            <Tag color="processing" icon={<SyncOutlined />} variant="solid">
                              {item.status}
                            </Tag>
                          )}
                          {item.status === "RECOLECTADO" && (
                            <Tag color="success" icon={<CheckCircleOutlined />} variant="solid">
                              {item.status}
                            </Tag>
                          )}
                        </Flex>
                        <Typography.Text>
                          {formatTimeAgo(item.createdAt * 1000)}
                        </Typography.Text>
                      </Flex>
                      <Flex gap="middle">
                        <Typography.Text>Producto:</Typography.Text>
                        <Typography.Text strong>{item.product}</Typography.Text>
                      </Flex>
                      <Flex justify="space-between" align="center">
                        <Typography.Text>Cantidad:</Typography.Text>
                        <Title level={3} style={{ margin: 0 }}>
                          {item.quantity}/{item.collected}
                        </Title>
                      </Flex>
                    </Flex>
                  </Card>
                ))}
                {hasNextPage && (
                  <Button
                    style={{ width: "100%", marginTop: 8 }}
                    loading={isFetchingNextPage}
                    onClick={() => fetchNextPage()}
                  >
                    Cargar más
                  </Button>
                )}
              </>
            ) : (
              <Flex justify="center" align="center" style={{ flex: 1 }}>
                <Typography.Text type="secondary">Sin pedidos</Typography.Text>
              </Flex>
            )}
          </>
        ) : orders.length ? (
          orders.map((order) => (
            <Card
              title={`ORDEN - ${order.createdAt.toString(36).toUpperCase()}`}
              id={order.id}
              key={order.id}
              extra={
                <Flex gap="small">
                  {/* <Button
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => onOpenEditOrder(order)}
                  /> */}
                  {activeItem === order.id && items.length === 0 && (
                    <Popconfirm
                      title="Eliminar orden"
                      description="¿Estás seguro de eliminar esta orden?"
                      okText="Sí"
                      cancelText="No"
                      onConfirm={() => onDeleteOrder(order.id)}
                    >
                      <Button
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        loading={deleteOrderMutation.isPending}
                      />
                    </Popconfirm>
                  )}
                </Flex>
              }
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

                              <Form.Item name="voucherKey">
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
                                    extra: (
                                      <Flex
                                        gap="small"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        {item.voucherKey && (
                                          <Button
                                            size="small"
                                            icon={<EyeOutlined />}
                                            loading={
                                              getImageSignedUrlMutation.isPending &&
                                              getImageSignedUrlMutation.variables ===
                                                item.voucherKey
                                            }
                                            onClick={() =>
                                              onViewVoucherImage(
                                                item.voucherKey!,
                                              )
                                            }
                                          />
                                        )}
                                        <Button
                                          size="small"
                                          icon={<EditOutlined />}
                                          onClick={() => onOpenEditItem(item)}
                                        />
                                        {item.status === "PENDIENTE" && (
                                          <Popconfirm
                                            title="Eliminar pedido"
                                            description="¿Estás seguro de eliminar este pedido?"
                                            okText="Sí"
                                            cancelText="No"
                                            onConfirm={() =>
                                              onDeleteItem(
                                                item.voucherId,
                                                item.orderId,
                                              )
                                            }
                                          >
                                            <Button
                                              size="small"
                                              danger
                                              icon={<DeleteOutlined />}
                                              loading={
                                                deleteItemMutation.isPending
                                              }
                                            />
                                          </Popconfirm>
                                        )}
                                      </Flex>
                                    ),
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

      {/* Modal editar orden */}
      <Modal
        open={openEditOrderModal}
        destroyOnHidden
        title="Editar orden"
        okText="Guardar"
        cancelText="Cancelar"
        okButtonProps={{
          htmlType: "submit",
          loading: updateOrderMutation.isPending,
        }}
        onCancel={() => {
          setOpenEditOrderModal(false);
          setEditingOrder(null);
          editOrderForm.resetFields();
        }}
        modalRender={(dom) => (
          <Form layout="vertical" form={editOrderForm} onFinish={onUpdateOrder}>
            {dom}
          </Form>
        )}
      >
        <Form.Item name="status" label="Estado">
          <Select
            options={[
              { value: "PENDIENTE", label: "PENDIENTE" },
              { value: "EN RUTA", label: "EN RUTA" },
              { value: "RECOLECTADO", label: "RECOLECTADO" },
            ]}
          />
        </Form.Item>
      </Modal>

      {/* Modal editar pedido */}
      <Modal
        open={openEditItemModal}
        destroyOnHidden
        title="Editar pedido"
        okText="Guardar"
        cancelText="Cancelar"
        okButtonProps={{
          htmlType: "submit",
          loading: updateItemMutation.isPending,
        }}
        onCancel={() => {
          setOpenEditItemModal(false);
          setEditingItem(null);
          editItemForm.resetFields();
        }}
        modalRender={(dom) => (
          <Form layout="vertical" form={editItemForm} onFinish={onUpdateItem}>
            {dom}
          </Form>
        )}
      >
        <Form.Item
          name="voucherId"
          label="Comprobante"
          rules={[{ required: true, message: "Campo requerido" }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="quantity"
          label="Cantidad"
          rules={[{ required: true, message: "Campo requerido" }]}
        >
          <InputNumber style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item
          name="product"
          label="Producto"
          rules={[{ required: true, message: "Campo requerido" }]}
        >
          <Select
            options={[
              { value: "Monocapa Gris", label: "Monocapa Gris" },
              { value: "Monocapa Blanco", label: "Monocapa Blanco" },
              { value: "Horcalsa", label: "Horcalsa" },
              { value: "Montaña", label: "Montaña" },
              { value: "Cemento Ariblock", label: "Cemento Ariblock" },
              { value: "Monocapa Extraliso", label: "Monocapa Extraliso" },
              { value: "Monocapa Ultraliso", label: "Monocapa Ultraliso" },
            ]}
          />
        </Form.Item>
        <Form.Item name="status" label="Estado">
          <Select
            options={[
              { value: "PENDIENTE", label: "PENDIENTE" },
              { value: "EN RUTA", label: "EN RUTA" },
              { value: "RECOLECTADO", label: "RECOLECTADO" },
            ]}
          />
        </Form.Item>
      </Modal>

      {/* Modal ver comprobante */}
      <Modal
        open={!!voucherImageUrl}
        title="Comprobante"
        footer={null}
        onCancel={() => setVoucherImageUrl(undefined)}
      >
        <img
          src={voucherImageUrl}
          alt="comprobante"
          style={{ width: "100%" }}
        />
      </Modal>
    </>
  );
};
