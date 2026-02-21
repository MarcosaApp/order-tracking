import {
  Button,
  Card,
  Collapse,
  Flex,
  Form,
  Input,
  InputNumber,
  Modal,
  Tag,
  Typography,
  message,
} from "antd";
import Title from "antd/es/typography/Title";
import { useState } from "react";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  DownloadOutlined,
  SyncOutlined,
} from "@ant-design/icons";
import { HttpService } from "../services/http.service";
import { formatTimeAgo } from "../utils/date.utils";
import { ENTITIES } from "../enums";
import type {
  CollectEntity,
  DeliveryEntity,
  ItemEntity,
} from "../interfaces/entities";
import jsPDF from "jspdf";
import { logoUrl } from "../logo";

const { Search: SearchText } = Input;

interface DriverPageProps {
  messageApi: ReturnType<typeof message.useMessage>[0];
}

const httpClient = new HttpService();

export const DriverPage: React.FC<DriverPageProps> = ({ messageApi }) => {
  const [collectForm] = Form.useForm<CollectEntity>();
  const [deliveryForm] = Form.useForm<DeliveryEntity>();

  const [collects, setCollects] = useState<CollectEntity[]>([]);
  const [deliveries, setDeliveries] = useState<DeliveryEntity[]>([]);
  const [searchedItem, setSearchedItem] = useState<ItemEntity>();

  const [openCollectModal, setOpenCollectModal] = useState(false);
  const [openDeliveryModal, setOpenDeliveryModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const onSearch = async (searchValue: string) => {
    setIsLoading(true);

    const searchResult = await httpClient.getEntity<ItemEntity>(
      ENTITIES.ITEM,
      messageApi,
      searchValue
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
      }
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

  const onChangeDriverCollapse = async (
    key: string | string[],
    itemId: string
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
            messageApi
          );

        if (deliveryResult?.items) {
          setDeliveries(deliveryResult.items);
        }
      }
    }
  };

  return (
    <>
      <Flex
        align="center"
        justify={"space-between"}
        style={{ height: "10%", padding: "12px" }}
      >
        <SearchText
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
                                onCreateCollect(values, searchedItem.voucherId);
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
                                            collect.createdAt! * 1000
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
                                onCreateDelivery(values, searchedItem.voucherId);
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
                              return deliveries.map((delivery) => {
                                return {
                                  key: delivery.id,
                                  label: `${delivery.createdAt?.toString(36).toUpperCase()}`,
                                  children: (
                                    <Flex
                                      vertical
                                      gap="small"
                                      key={delivery.id}
                                      id={delivery.id}
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
                                            {delivery.driver}
                                          </Tag>
                                        </Flex>

                                        <Typography.Text>
                                          {formatTimeAgo(
                                            delivery.createdAt! * 1000
                                          )}
                                        </Typography.Text>
                                      </Flex>
                                      <Flex gap="middle">
                                        <Typography.Text>
                                          Camion:
                                        </Typography.Text>
                                        <Typography.Text strong>
                                          {delivery.truck}
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
                                          {delivery.quantity}
                                        </Title>
                                      </Flex>
                                      <Button
                                        type={"dashed"}
                                        icon={<DownloadOutlined />}
                                        onClick={async () => {
                                          const doc = new jsPDF({
                                            orientation: "landscape",
                                            format: [150, 125],
                                            compress: true,
                                          });

                                          const pageWidth =
                                            doc.internal.pageSize.getWidth();

                                          doc.setFontSize(15);

                                          doc.addImage(
                                            logoUrl,
                                            "JPEG",
                                            5,
                                            2,
                                            80,
                                            35
                                          );

                                          doc.setFont(
                                            "Helvetica",
                                            "normal",
                                            "bold"
                                          );

                                          doc.text(
                                            `# ${delivery.createdAt?.toString(36).toUpperCase()}`,
                                            pageWidth - 10,
                                            23,
                                            { align: "right" }
                                          );

                                          doc.setFontSize(12);

                                          doc.setFont("courier", "italic");

                                          doc.text(
                                            `${new Date(delivery.createdAt! * 1000).toLocaleString()}`,
                                            pageWidth - 10,
                                            50,
                                            { align: "right" }
                                          );

                                          doc.setFontSize(13);
                                          doc.setFont("courier", "normal");

                                          doc.text("Cliente:", 10, 70, {
                                            align: "left",
                                          });

                                          doc.text(
                                            `${delivery.customer}`,
                                            pageWidth - 10,
                                            70,
                                            { align: "right" }
                                          );

                                          doc.text("Entregado por:", 10, 80, {
                                            align: "left",
                                          });

                                          doc.text(
                                            delivery.driver,
                                            pageWidth - 10,
                                            80,
                                            { align: "right" }
                                          );

                                          doc.text("Camion:", 10, 90, {
                                            align: "left",
                                          });

                                          doc.text(
                                            delivery.truck,
                                            pageWidth - 10,
                                            90,
                                            { align: "right" }
                                          );

                                          doc.text("Producto:", 10, 100, {
                                            align: "left",
                                          });

                                          doc.text(
                                            `${searchedItem.product}`,
                                            pageWidth - 10,
                                            100,
                                            { align: "right" }
                                          );

                                          doc.text("Cantidad:", 10, 110, {
                                            align: "left",
                                          });

                                          doc.text(
                                            `${delivery.quantity}`,
                                            pageWidth - 10,
                                            110,
                                            { align: "right" }
                                          );

                                          const randomDocId =
                                            Date.now().toString(36);

                                          doc.save(
                                            `pedido-${delivery.voucherId}-${randomDocId.slice(4, randomDocId.length)}.pdf`
                                          );
                                        }}
                                      >
                                        Voucher
                                      </Button>
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
  );
};
