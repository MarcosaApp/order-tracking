import type { MessageInstance } from "antd/es/message/interface";
import { ENTITIES } from "../enums";

export const BASE_URL = "http://localhost:8081/api/v1";

interface TResponse<T> {
  error: boolean;
  data: T;
  message?: string;
}

interface QueryResponse<T> {
  items: T[];
  cursor?: {
    [key: string]: any | undefined;
  };
}

export class HttpService {
  async getAllOrders<T>(
    entity: string,
    messageApi: MessageInstance,
  ): Promise<T | undefined> {
    try {
      const request = await fetch(`${BASE_URL}/${entity}`, {
        method: "GET",
      });

      if (!request.ok) {
        throw new Error("Error enviando la peticion al servidor");
      }

      const response = (await request.json()) as TResponse<T>;

      if (response.error) {
        throw new Error(`Error creando la entidad: ${entity}`);
      }

      return response.data;
    } catch (error) {
      if (error instanceof Error) {
        messageApi.error({
          type: "error",
          content: error.message,
        });
      }

      return;
    }
  }

  async getItemsByOrder<T>(
    orderId: string,
    messageApi: MessageInstance,
  ): Promise<QueryResponse<T> | undefined> {
    try {
      const request = await fetch(`${BASE_URL}/manager/items/${orderId}`, {
        method: "GET",
      });

      if (!request.ok) {
        throw new Error("Error enviando la peticion al servidor");
      }

      const response = (await request.json()) as TResponse<QueryResponse<T>>;

      if (response.error) {
        throw new Error(`Error al obtener los registros`);
      }

      return response.data;
    } catch (error) {
      if (error instanceof Error) {
        messageApi.error({
          type: "error",
          content: error.message,
        });
      }

      return;
    }
  }

  async getCollectsByItem<T>(
    voucherId: string,
    messageApi: MessageInstance,
  ): Promise<QueryResponse<T> | undefined> {
    try {
      const request = await fetch(
        `${BASE_URL}/manager/collect/item/${voucherId}`,
      );

      if (!request.ok) {
        throw new Error("Error enviando la peticion al servidor");
      }

      const response = (await request.json()) as TResponse<QueryResponse<T>>;

      if (response.error) {
        throw new Error("Error creando la entidad");
      }

      return response.data;
    } catch (error) {
      if (error instanceof Error) {
        messageApi.error({
          type: "error",
          content: error.message,
        });
      }

      return;
    }
  }

  async getDeliveriesByItem<T>(
    voucherId: string,
    messageApi: MessageInstance,
  ): Promise<QueryResponse<T> | undefined> {
    try {
      const request = await fetch(
        `${BASE_URL}/manager/delivery/item/${voucherId}`,
      );

      if (!request.ok) {
        throw new Error("Error enviando la peticion al servidor");
      }

      const response = (await request.json()) as TResponse<QueryResponse<T>>;

      if (response.error) {
        throw new Error("Error al obtener los registros");
      }

      return response.data;
    } catch (error) {
      if (error instanceof Error) {
        messageApi.error({
          type: "error",
          content: error.message,
        });
      }

      return;
    }
  }

  async createOrder<T>(
    entity: ENTITIES.ORDER,
    messageApi: MessageInstance,
  ): Promise<T | undefined> {
    try {
      const request = await fetch(`${BASE_URL}/${entity}`, {
        method: "POST",
      });

      if (!request.ok) {
        throw new Error("Error enviando la peticion al servidor");
      }

      const response = (await request.json()) as TResponse<T>;

      if (response.error) {
        throw new Error(`Error creando la entidad: ${entity}`);
      }

      return response.data;
    } catch (error) {
      if (error instanceof Error) {
        messageApi.error({
          type: "error",
          content: error.message,
        });
      }

      return;
    }
  }

  async createEntity<T>(
    entity: ENTITIES,
    messageApi: MessageInstance,
    body: T,
  ): Promise<T | undefined> {
    try {
      const request = await fetch(`${BASE_URL}/${entity}`, {
        method: "POST",
        body: JSON.stringify(body),
      });

      if (!request.ok) {
        throw new Error("Error enviando la peticion al servidor");
      }

      const response = (await request.json()) as TResponse<T>;

      if (response.error) {
        throw new Error(`Error creando la entidad: ${entity}`);
      }

      return response.data;
    } catch (error) {
      if (error instanceof Error) {
        messageApi.error({
          type: "error",
          content: error.message,
        });
      }

      return;
    }
  }

  async getEntity<T>(
    entity: ENTITIES,
    messageApi: MessageInstance,
    id: string,
  ): Promise<T | undefined> {
    try {
      const request = await fetch(`${BASE_URL}/${entity}/${id}`);

      if (!request.ok) {
        throw new Error("Error enviando la peticion al servidor");
      }

      const response = (await request.json()) as TResponse<T>;

      if (response.error) {
        throw new Error("Error en la busqueda");
      }

      if (response.message) {
        messageApi.info({
          type: "info",
          content: response.message,
        });

        return;
      }

      return response.data;
    } catch (error) {
      if (error instanceof Error) {
        messageApi.error({
          type: "error",
          content: error.message,
        });
      }

      return;
    }
  }

  async getAll<T>(
    entity: string,
    messageApi: MessageInstance,
  ): Promise<T | undefined> {
    try {
      const request = await fetch(`${BASE_URL}/manager/${entity}`, {
        method: "GET",
      });

      if (!request.ok) {
        throw new Error("Error enviando la peticion al servidor");
      }

      const response = (await request.json()) as TResponse<T>;

      if (response.error) {
        throw new Error(`Error creando la entidad: ${entity}`);
      }

      return response.data;
    } catch (error) {
      if (error instanceof Error) {
        messageApi.error({
          type: "error",
          content: error.message,
        });
      }

      return;
    }
  }

  async updateEntity<T>(
    entity: ENTITIES,
    messageApi: MessageInstance,
    body: T,
  ): Promise<T | undefined> {
    try {
      const request = await fetch(`${BASE_URL}/${entity}`, {
        method: "PUT",
        body: JSON.stringify(body),
      });

      if (!request.ok) {
        throw new Error("Error enviando la peticion al servidor");
      }

      const response = (await request.json()) as TResponse<T>;

      if (response.error) {
        throw new Error(`Error creando la entidad: ${entity}`);
      }

      return response.data;
    } catch (error) {
      if (error instanceof Error) {
        messageApi.error({
          type: "error",
          content: error.message,
        });
      }

      return;
    }
  }
}
