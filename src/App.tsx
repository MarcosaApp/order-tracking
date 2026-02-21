import {
  Button,
  Col,
  Flex,
  Layout,
  Row,
  Tag,
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

const layoutStyle = {
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

// Session expiration time in milliseconds (8 hours)
const SESSION_DURATION = 8 * 60 * 60 * 1000;
const SESSION_STORAGE_KEY = "order_tracking_session";

interface SessionData {
  role: "admin" | "driver";
  expiresAt: number;
}

function App() {
  const [messageApi, contextHolder] = message.useMessage();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<"admin" | "driver" | null>(null);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = () => {
      try {
        const sessionData = localStorage.getItem(SESSION_STORAGE_KEY);
        if (sessionData) {
          const session: SessionData = JSON.parse(sessionData);
          const now = Date.now();

          // Check if session is still valid
          if (session.expiresAt > now) {
            setUserRole(session.role);
            setIsAuthenticated(true);
          } else {
            // Session expired, clear it
            localStorage.removeItem(SESSION_STORAGE_KEY);
            messageApi.warning("Sesión expirada. Por favor inicie sesión nuevamente.");
          }
        }
      } catch (error) {
        console.error("Error checking session:", error);
        localStorage.removeItem(SESSION_STORAGE_KEY);
      }
    };

    checkSession();
  }, [messageApi]);

  // Periodically check if session has expired (every minute)
  useEffect(() => {
    if (!isAuthenticated) return;

    const checkSessionExpiration = () => {
      try {
        const sessionData = localStorage.getItem(SESSION_STORAGE_KEY);
        if (sessionData) {
          const session: SessionData = JSON.parse(sessionData);
          const now = Date.now();

          if (session.expiresAt <= now) {
            // Session expired
            localStorage.removeItem(SESSION_STORAGE_KEY);
            setIsAuthenticated(false);
            setUserRole(null);
            messageApi.warning("Su sesión ha expirado. Por favor inicie sesión nuevamente.");
          }
        } else {
          // Session data missing
          setIsAuthenticated(false);
          setUserRole(null);
        }
      } catch (error) {
        console.error("Error checking session expiration:", error);
      }
    };

    // Check every minute
    const interval = setInterval(checkSessionExpiration, 60000);

    return () => clearInterval(interval);
  }, [isAuthenticated, messageApi]);

  const handleLogin = (role: "admin" | "driver") => {
    const expiresAt = Date.now() + SESSION_DURATION;
    const sessionData: SessionData = {
      role,
      expiresAt,
    };

    // Save session to localStorage
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));

    setUserRole(role);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    // Clear session from localStorage
    localStorage.removeItem(SESSION_STORAGE_KEY);

    setIsAuthenticated(false);
    setUserRole(null);
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
          colorPrimary: "#1890ff", // Daybreak Blue
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
              <Flex justify="space-between" align="center" style={{ height: "100%", padding: "0 20px" }}>
                <Image src={logo} height={"inherit"} preview={false}></Image>
                <Flex gap="small" align="center">
                  <Tag color={userRole === "admin" ? "blue" : "green"} style={{ fontSize: "14px", padding: "4px 12px" }}>
                    {userRole === "admin" ? "ADMINISTRADOR" : "PILOTO"}
                  </Tag>
                  <Button
                    type="primary"
                    danger
                    icon={<LogoutOutlined />}
                    onClick={handleLogout}
                  >
                    Salir
                  </Button>
                </Flex>
              </Flex>
            </Header>
            <Content style={contentStyle}>
              {userRole === "admin" ? (
                <AdminPage messageApi={messageApi} />
              ) : (
                <DriverPage messageApi={messageApi} />
              )}
            </Content>
          </Layout>
        </Col>
        <Col xl={8} md={6} xs={24} style={{ background: "#8c8c8c" }}></Col>
      </Row>
    </ConfigProvider>
  );
}

export default App;