import {
  Button,
  Card,
  ConfigProvider,
  Flex,
  Form,
  Input,
  Typography,
  message,
  theme as antTheme,
} from "antd";
import { LockOutlined, UserOutlined } from "@ant-design/icons";
import { useState } from "react";
import { authenticateUser } from "../utils/auth.utils";

const { Title } = Typography;

interface LoginProps {
  onLogin: (role: "admin" | "driver", username: string) => void;
}

interface LoginFormValues {
  username: string;
  password: string;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);

  const handleLogin = async (values: LoginFormValues) => {
    setLoading(true);
    setTimeout(async () => {
      const { username, password } = values;
      const user = authenticateUser(username, password);
      if (user) {
        const welcomeMessage =
          user.role === "admin" ? "Bienvenido Administrador" : "Bienvenido Piloto";
        messageApi.success(welcomeMessage);
        setTimeout(() => onLogin(user.role, user.username), 500);
      } else {
        messageApi.error("Usuario o contraseña incorrectos");
        setLoading(false);
      }
    }, 500);
  };

  return (
    <>
      {contextHolder}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
      `}</style>
      <ConfigProvider
        theme={{
          algorithm: antTheme.darkAlgorithm,
          token: {
            colorPrimary: "#1f6feb",
            fontFamily: "'DM Sans', sans-serif",
            colorBgContainer: "#161b22",
            colorBorder: "#30363d",
            colorText: "#e6edf3",
            colorTextPlaceholder: "#8b949e",
          },
        }}
      >
        <Flex
          justify="center"
          align="center"
          style={{ minHeight: "100vh", background: "#0d1117" }}
        >
          <Flex
            vertical
            align="center"
            gap={32}
            style={{ width: 400, padding: "0 16px" }}
          >
            {/* Card */}
            <Card
              style={{
                width: "100%",
                background: "#161b22",
                border: "1px solid #30363d",
                borderRadius: 12,
              }}
            >
              <Flex vertical gap="large">
                <Flex vertical align="center" gap={4}>
                  <Title
                    level={3}
                    style={{
                      margin: 0,
                      fontFamily: "'Syne', sans-serif",
                      color: "#e6edf3",
                    }}
                  >
                    Iniciar Sesión
                  </Title>
                  <Typography.Text style={{ color: "#8b949e", fontSize: 13 }}>
                    Ingresa tus credenciales para continuar
                  </Typography.Text>
                </Flex>

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
                      prefix={<UserOutlined style={{ color: "#8b949e" }} />}
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
                      prefix={<LockOutlined style={{ color: "#8b949e" }} />}
                      placeholder="Contraseña"
                      autoComplete="current-password"
                    />
                  </Form.Item>

                  <Form.Item style={{ marginBottom: 0 }}>
                    <Button
                      type="primary"
                      htmlType="submit"
                      block
                      loading={loading}
                      style={{
                        height: 45,
                        fontFamily: "'DM Sans', sans-serif",
                        fontWeight: 500,
                        background: "#1f6feb",
                      }}
                    >
                      Ingresar
                    </Button>
                  </Form.Item>
                </Form>
              </Flex>
            </Card>
          </Flex>
        </Flex>
      </ConfigProvider>
    </>
  );
};
