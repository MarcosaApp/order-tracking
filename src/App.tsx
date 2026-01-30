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
  Table,
  Divider,
} from "antd";
import "./App.css";
import { Content, Header } from "antd/es/layout/layout";
import Title from "antd/es/typography/Title";
import { useEffect, useState } from "react";
import { PlusOutlined } from "@ant-design/icons";

const layoutStyle = {
  // backgroundColor: "black",
  overflow: "hidden",
};

const headerStyle: React.CSSProperties = {
  height: "10vh",
  backgroundColor: "#4096ff",
  // background: "#f5f5f5",
};

const contentStyle: React.CSSProperties = {
  textAlign: "center",
  height: "90vh",
};

interface Values {
  title?: string;
  description?: string;
  modifier?: string;
}

interface Collect {
  collectId: string;
  quantity: number;
}
interface OrderValues {
  status: string;
  product: string;
  quantity: number;
  reference: string;
  driver: string;
  collects?: Collect[];
}

interface OrdersToCollect {
  orderId: string;
  orders: OrderValues[];
}

function App() {
  const [orderForm] = Form.useForm();
  const [collectForm] = Form.useForm();

  // const [collectValues, setCollectValues] = useState<Values>();
  const [orderValues, setOrderValues] = useState<OrderValues[]>([]);
  const [ordersToCollect, setOrdersToCollect] = useState<OrdersToCollect[]>([]);

  const [open, setOpen] = useState(false);

  useEffect(() => {
    ordersToCollect;
  });

  const onCollect = (_collect: Collect) => {
    setOpen(false);
  };

  const onFinish = (values: OrderValues) => {
    setOrderValues((prevItems) => [
      ...prevItems,
      { ...values, status: "PENDIENTE" },
    ]);
    orderForm.resetFields();
  };

  const onFinishFailed = (errorInfo: any) => {
    console.log("Failed:", errorInfo);
  };

  const columns = [
    {
      title: "Referencia",
      dataIndex: "reference",
      key: "reference",
    },
    {
      title: "Producto",
      dataIndex: "product",
      key: "product",
    },
    {
      title: "Cantidad",
      dataIndex: "quantity",
      key: "quantity",
    },
    {
      title: "Piloto",
      dataIndex: "driver",
      key: "driver",
    },
  ];

  const ordersPackage = [
    {
      orderId: "Pedido #100",
      orders: [
        {
          status: "PENDIENTE",
          product: "Cemento",
          quantity: 1200,
          reference: "8520-4580",
          driver: "Jose Barrios",
          collects: [
            { collectId: "#1", quantity: 300 },
            { collectId: "#2", quantity: 600 },
          ],
        },
        {
          status: "PENDIENTE",
          product: "Block",
          quantity: 900,
          reference: "7410-8520",
          driver: "Jose Barrios",
          collects: [
            { collectId: "#1", quantity: 300 },
            { collectId: "#2", quantity: 600 },
          ],
        },
      ],
    },
  ];

  return (
    <Row>
      <Col xl={8} md={6} xs={24}></Col>
      <Col xl={8} md={12} xs={24}>
        <Layout style={layoutStyle}>
          <Header style={headerStyle}>
            <Flex
              justify="center"
              align="center"
              vertical
              style={{ height: "100%" }}
            >
              <Title level={4} style={{ margin: 0 }}>
                CONTROL DE ORDENES
              </Title>
            </Flex>
          </Header>
          <Content style={contentStyle}>
            {/* CREACION DE PEDIDO */}
            <Flex
              align="start"
              justify="space-between"
              vertical
              style={{ height: "auto", padding: "12px" }}
            >
              <Form
                name="basic"
                style={{ width: "100%" }}
                onFinish={onFinish}
                onFinishFailed={onFinishFailed}
                autoComplete="off"
                form={orderForm}
                initialValues={{ modifier: "public" }}
                clearOnDestroy
              >
                <Form.Item name="reference">
                  <Flex style={{ width: "100%" }}>
                    <Input
                      placeholder="Ingresar numero de comprobante"
                      name="reference"
                    ></Input>
                  </Flex>
                </Form.Item>

                <Form.Item name="driver">
                  <Select
                    placeholder="Asignar piloto"
                    options={[
                      {
                        value: "Erick Geovanny Arana Ortiz",
                        label: "Erick Geovanny Arana Ortiz",
                      },
                      {
                        value: "Jose Castellanos Barrios Gonzalez",
                        label: "Jose Castellanos Barrios Gonzalez",
                      },
                    ]}
                    style={{ width: "100%" }}
                  ></Select>
                </Form.Item>

                <Flex
                  justify="space-between"
                  align="center"
                  style={{ width: "100%" }}
                >
                  <Form.Item
                    label="Producto:"
                    name="product"
                    layout="vertical"
                    style={{ width: "40%" }}
                  >
                    <Select
                      options={[
                        { value: "Block", label: "Block" },
                        { value: "Cemento", label: "Cemento" },
                      ]}
                    ></Select>
                  </Form.Item>

                  <Form.Item
                    label="Cantidad:"
                    name="quantity"
                    layout="vertical"
                    style={{ width: "40%" }}
                  >
                    <Flex style={{ width: "100%" }}>
                      <InputNumber style={{ width: "100%" }}></InputNumber>
                    </Flex>
                  </Form.Item>

                  <Form.Item style={{ margin: 0 }}>
                    <Button
                      type="primary"
                      htmlType="submit"
                      shape="circle"
                      icon={<PlusOutlined />}
                    ></Button>
                  </Form.Item>
                </Flex>
              </Form>

              <Flex
                align="start"
                style={{ width: "100%", padding: 5 }}
                vertical
              >
                {orderValues.length ? (
                  <Table
                    style={{ marginBottom: 10 }}
                    dataSource={orderValues}
                    columns={columns}
                    size="small"
                    pagination={false}
                    tableLayout="fixed"
                    locale={{ emptyText: "" }}
                  />
                ) : (
                  <></>
                )}
              </Flex>

              <Button
                type="primary"
                htmlType="submit"
                style={{ width: "100%" }}
                onClick={() => {
                  setOrdersToCollect((prevItems) => [
                    ...prevItems,
                    { orderId: crypto.randomUUID(), orders: orderValues },
                  ]);
                  setOrderValues([]);
                }}
              >
                CREAR ORDEN
              </Button>
            </Flex>

            {/* LISTADO DE PEDIDOS */}
            <Flex
              className="hide-scrollbar"
              vertical
              gap="small"
              style={{
                overflow: "scroll",
                height: "65%",
                padding: "8px",
              }}
            >
              {ordersToCollect.map((order) =>
                order ? (
                  <Card title={order.orderId}>
                    {order.orders?.map((item) => (
                      <Flex vertical gap="small" style={{ margin: 10 }}>
                        <Flex gap="middle">
                          <Typography.Text>Piloto:</Typography.Text>
                          <Typography.Text>{item.driver}</Typography.Text>
                        </Flex>
                        <Flex gap="middle">
                          <Typography.Text>Estado:</Typography.Text>
                          <Tag key={"red"} color={"red"} variant="solid">
                            {item.status}
                          </Tag>
                        </Flex>
                        <Flex gap="middle">
                          <Typography.Text>Producto:</Typography.Text>
                          <Typography.Text>{item.product}</Typography.Text>
                        </Flex>
                        <Flex>
                          <Typography.Text>Cantidad:</Typography.Text>
                        </Flex>
                        <Flex justify="center" style={{ width: "100%" }}>
                          <Title level={2}>{item.quantity}/0</Title>
                        </Flex>
                        <Flex gap="middle">
                          <Typography.Text>Recolectas:</Typography.Text>
                        </Flex>
                        <Flex gap="middle">
                          <Button
                            type="primary"
                            style={{ width: "100%", marginBottom: 10 }}
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
                                layout="vertical"
                                form={collectForm}
                                name="form_in_modal"
                                initialValues={{ modifier: "public" }}
                                clearOnDestroy
                                onFinish={(values) => onCollect(values)}
                              >
                                {dom}
                              </Form>
                            )}
                          >
                            <Form.Item name="quantity" label="Cantidad">
                              <Input type="number" />
                            </Form.Item>
                          </Modal>
                        </Flex>
                        {item.collects?.map((collect) => (
                          <>
                            <Flex gap="middle">
                              <Typography.Text>
                                Recolecta {collect.collectId}
                              </Typography.Text>
                              <Typography.Text>-----</Typography.Text>
                              <Typography.Text>
                                Cantidad: {collect.quantity}
                              </Typography.Text>
                            </Flex>
                          </>
                        ))}
                        <Divider />
                      </Flex>
                    ))}
                  </Card>
                ) : (
                  <></>
                ),
              )}
            </Flex>
          </Content>
        </Layout>
      </Col>
      <Col xl={8} md={6} xs={24}></Col>
    </Row>
  );
}

export default App;
