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
import { createSession, validateSession } from "./utils/auth.utils";

const layoutStyle = {
  overflow: "hidden",
  background: "#0d1117",
};

const headerStyle: React.CSSProperties = {
  height: "10vh",
  backgroundColor: "white",
  padding: "0",
  overflow: "hidden",
};

const contentStyle: React.CSSProperties = {
  textAlign: "center",
  height: "90vh",
};

const SESSION_DURATION = 8 * 60 * 60 * 1000;
const SESSION_STORAGE_KEY = "order_tracking_session";

function App() {
  const [messageApi, contextHolder] = message.useMessage();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<"admin" | "driver" | null>(null);
  const [username, setUsername] = useState<string>("");

  useEffect(() => {
    const checkSession = async () => {
      try {
        const sessionString = localStorage.getItem(SESSION_STORAGE_KEY);
        const sessionData = await validateSession(sessionString);

        if (sessionData) {
          setUserRole(sessionData.role);
          setUsername(sessionData.username);
          setIsAuthenticated(true);
        } else if (sessionString) {
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

  useEffect(() => {
    if (!isAuthenticated) return;

    const checkSessionExpiration = async () => {
      try {
        const sessionString = localStorage.getItem(SESSION_STORAGE_KEY);
        const sessionData = await validateSession(sessionString);

        if (!sessionData) {
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

    const interval = setInterval(checkSessionExpiration, 60000);
    return () => clearInterval(interval);
  }, [isAuthenticated, messageApi]);

  const handleLogin = async (role: "admin" | "driver", username: string) => {
    const expiresAt = Date.now() + SESSION_DURATION;
    const signedSession = await createSession(role, username, expiresAt);
    localStorage.setItem(SESSION_STORAGE_KEY, signedSession);
    setUserRole(role);
    setUsername(username);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    setIsAuthenticated(false);
    setUserRole(null);
    setUsername("");
    messageApi.info("Sesión cerrada");
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: "#1f6feb",
          colorInfo: "#58a6ff",
          colorLink: "#58a6ff",
          borderRadius: 6,
          fontFamily: "'DM Sans', sans-serif",
        },
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
      `}</style>
      <>{contextHolder}</>
      <Row style={{ background: "#0d1117", minHeight: "100vh" }}>
        <Col xl={8} md={6} xs={0} style={{ background: "#0d1117" }} />
        <Col xl={8} md={12} xs={24}>
          <Layout style={layoutStyle}>
            <Header style={headerStyle}>
              <Flex
                justify="space-between"
                align="center"
                style={{ height: "100%" }}
              >
                <Flex
                  justify="center"
                  align="center"
                  style={{ width: "50%", overflow: "hidden", height: 'inherit' }}
                >
                  <Image
                    src={logo}
                    preview={false}
                    height={85}
                    // style={{ width: "100%", height: "inherit" }}
                  />
                </Flex>

                <Flex
                  justify="space-evenly"
                  align="center"
                  style={{ width: "50%" }}
                >
                  <Tag
                    color={userRole === "admin" ? "blue" : "green"}
                    style={{
                      fontSize: "12px",
                      margin: 0,
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    {userRole === "admin" ? "ADMINISTRADOR" : "PILOTO"}
                  </Tag>
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
        <Col xl={8} md={6} xs={0} style={{ background: "#0d1117" }} />
      </Row>
    </ConfigProvider>
  );
}

export default App;
