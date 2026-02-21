import { Button, Card, Flex, Form, Input, Typography, message } from "antd";
import { LockOutlined, UserOutlined } from "@ant-design/icons";
import { useState } from "react";

const { Title } = Typography;

interface LoginProps {
  onLogin: (role: "admin" | "driver") => void;
}

interface LoginFormValues {
  username: string;
  password: string;
}

// Hardcoded users
const USERS = {
  admin: {
    username: "admin",
    password: "admin123",
    role: "admin" as const,
  },
  driver: {
    username: "driver",
    password: "driver123",
    role: "driver" as const,
  },
};

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);

  const handleLogin = (values: LoginFormValues) => {
    setLoading(true);

    // Simulate a slight delay for more realistic UX
    setTimeout(() => {
      const { username, password } = values;

      // Check admin credentials
      if (
        username === USERS.admin.username &&
        password === USERS.admin.password
      ) {
        messageApi.success("Bienvenido Administrador");
        setTimeout(() => onLogin(USERS.admin.role), 500);
        return;
      }

      // Check driver credentials
      if (
        username === USERS.driver.username &&
        password === USERS.driver.password
      ) {
        messageApi.success("Bienvenido Piloto");
        setTimeout(() => onLogin(USERS.driver.role), 500);
        return;
      }

      // Invalid credentials
      messageApi.error("Usuario o contraseña incorrectos");
      setLoading(false);
    }, 500);
  };

  return (
    <>
      {contextHolder}
      <Flex
        justify="center"
        align="center"
        style={{
          minHeight: "100vh",
          background: "linear-gradient(135deg, #1890ff 0%, #096dd9 100%)",
        }}
      >
        <Card
          style={{
            width: 400,
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
          }}
        >
          <Flex vertical gap="large">
            <Title level={2} style={{ textAlign: "center", margin: 0 }}>
              Iniciar Sesión
            </Title>

            <Form
              name="login"
              onFinish={handleLogin}
              autoComplete="off"
              layout="vertical"
              size="large"
            >
              <Form.Item
                name="username"
                rules={[
                  {
                    required: true,
                    message: "Por favor ingrese su usuario",
                  },
                ]}
              >
                <Input
                  prefix={<UserOutlined />}
                  placeholder="Usuario"
                  autoComplete="username"
                />
              </Form.Item>

              <Form.Item
                name="password"
                rules={[
                  {
                    required: true,
                    message: "Por favor ingrese su contraseña",
                  },
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="Contraseña"
                  autoComplete="current-password"
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  loading={loading}
                  style={{ height: 45 }}
                >
                  Ingresar
                </Button>
              </Form.Item>
            </Form>

            <Flex vertical gap="small" style={{ fontSize: "12px", color: "#888" }}>
              <div>
                <strong>Admin:</strong> admin / admin123
              </div>
              <div>
                <strong>Piloto:</strong> driver / driver123
              </div>
              <div style={{ marginTop: "10px", fontSize: "11px", textAlign: "center", color: "#999" }}>
                La sesión expira después de 8 horas de inactividad
              </div>
            </Flex>
          </Flex>
        </Card>
      </Flex>
    </>
  );
};
