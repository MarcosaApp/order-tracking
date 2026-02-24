import {
  Button,
  Col,
  Flex,
  Layout,
  Row,
  Tag,
  Typography,
  message,
  Image,
  ConfigProvider,
  theme,
} from "antd";
import "./App.css";
import { Content, Header } from "antd/es/layout/layout";
import { useEffect, useState } from "react";
import { LogoutOutlined } from "@ant-design/icons";
import logo from "./assets/logo.jpeg";
import { Login } from "./components/Login";
import { AdminPage } from "./pages/AdminPage";
import { DriverPage } from "./pages/DriverPage";
import { createSession, validateSession } from "./utils/auth.utils";

const layoutStyle = {
  overflow: "hidden",
};

const headerStyle: React.CSSProperties = {
  height: "10vh",
  backgroundColor: "white",
  padding: 20,
};

const contentStyle: React.CSSProperties = {
  textAlign: "center",
  height: "90vh",
};

// Session expiration time in milliseconds (8 hours)
const SESSION_DURATION = 8 * 60 * 60 * 1000;
const SESSION_STORAGE_KEY = "order_tracking_session";

function App() {
  const [messageApi, contextHolder] = message.useMessage();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<"admin" | "driver" | null>(null);
  const [username, setUsername] = useState<string>("");

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const sessionString = localStorage.getItem(SESSION_STORAGE_KEY);
        const sessionData = await validateSession(sessionString);

        if (sessionData) {
          // Valid session found
          setUserRole(sessionData.role);
          setUsername(sessionData.username);
          setIsAuthenticated(true);
        } else if (sessionString) {
          // Invalid or expired session
          localStorage.removeItem(SESSION_STORAGE_KEY);
          messageApi.warning(
            "Sesión expirada o inválida. Por favor inicie sesión nuevamente.",
          );
        }
      } catch (error) {
        console.error("Error checking session:", error);
        localStorage.removeItem(SESSION_STORAGE_KEY);
      }
    };

    checkSession();
  }, [messageApi]);

  // Periodically check if session has expired or been tampered with (every minute)
  useEffect(() => {
    if (!isAuthenticated) return;

    const checkSessionExpiration = async () => {
      try {
        const sessionString = localStorage.getItem(SESSION_STORAGE_KEY);
        const sessionData = await validateSession(sessionString);

        if (!sessionData) {
          // Session expired or tampered with
          localStorage.removeItem(SESSION_STORAGE_KEY);
          setIsAuthenticated(false);
          setUserRole(null);
          setUsername("");
          messageApi.warning(
            "Su sesión ha expirado o ha sido modificada. Por favor inicie sesión nuevamente.",
          );
        }
      } catch (error) {
        console.error("Error checking session expiration:", error);
      }
    };

    // Check every minute
    const interval = setInterval(checkSessionExpiration, 60000);

    return () => clearInterval(interval);
  }, [isAuthenticated, messageApi]);

  const handleLogin = async (role: "admin" | "driver", username: string) => {
    const expiresAt = Date.now() + SESSION_DURATION;

    // Create signed session with cryptographic signature
    const signedSession = await createSession(role, username, expiresAt);

    // Save signed session to localStorage
    localStorage.setItem(SESSION_STORAGE_KEY, signedSession);

    setUserRole(role);
    setUsername(username);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    // Clear session from localStorage
    localStorage.removeItem(SESSION_STORAGE_KEY);

    setIsAuthenticated(false);
    setUserRole(null);
    setUsername("");
    messageApi.info("Sesión cerrada");
  };

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return (
      <ConfigProvider
        theme={{
          algorithm: theme.defaultAlgorithm,
          token: {
            colorPrimary: "#1890ff", // Daybreak Blue
            colorInfo: "#1890ff",
            colorLink: "#1890ff",
            borderRadius: 6,
          },
        }}
      >
        <Login onLogin={handleLogin} />
      </ConfigProvider>
    );
  }

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: "#1890ff",
          colorInfo: "#1890ff",
          colorLink: "#1890ff",
          borderRadius: 6,
        },
      }}
    >
      <Row>
        <Col xl={8} md={6} xs={24} style={{ background: "#8c8c8c" }}></Col>
        <Col xl={8} md={12} xs={24}>
          <Layout style={layoutStyle}>
            <>{contextHolder}</>
            <Header style={headerStyle}>
              <Flex
                justify={"space-between"}
                align={"center"}
                style={{ height: "100%" }}
              >
                <Flex style={{ width: "50%" }}>
                  <Image src={logo} preview={false} />
                </Flex>

                <Flex gap={"small"}>
                  <Flex gap="medium" align="center">
                    <Tag
                      color={userRole === "admin" ? "blue" : "green"}
                      style={{ fontSize: "12px", margin: 0 }}
                    >
                      {userRole === "admin" ? "ADMINISTRADOR" : "PILOTO"}
                    </Tag>
                  </Flex>
                  <Button
                    type="text"
                    danger
                    icon={<LogoutOutlined />}
                    onClick={handleLogout}
                  />
                </Flex>
              </Flex>
            </Header>
            <Content style={contentStyle}>
              {userRole === "admin" ? <AdminPage /> : <DriverPage />}
            </Content>
          </Layout>
        </Col>
        <Col xl={8} md={6} xs={24} style={{ background: "#8c8c8c" }}></Col>
      </Row>
    </ConfigProvider>
  );
}

export default App;
