import { apiClient } from "./api-client";
import type {
  OrderEntity,
  ItemEntity,
  CollectEntity,
  DeliveryEntity
} from "../interfaces/entities";

interface QueryResponse<T> {
  items: T[];
  cursor?: Record<string, any>;
}

interface CollectResponse {
  collect: CollectEntity;
  item: ItemEntity;
}

export const orderService = {
  // Orders
  getAllOrders: () =>
    apiClient.get<QueryResponse<OrderEntity>>("/manager/order"),

  createOrder: () =>
    apiClient.post<OrderEntity>("/order"),

  // Items
  getItemsByOrder: (orderId: string) =>
    apiClient.get<QueryResponse<ItemEntity>>(`/manager/items/${orderId}`),

  getItemById: (voucherId: string) =>
    apiClient.get<ItemEntity>(`/item/${voucherId}`),

  createItem: (item: Partial<ItemEntity>) =>
    apiClient.post<ItemEntity>("/item", item),

  // Collects
  getCollectsByItem: (voucherId: string) =>
    apiClient.get<QueryResponse<CollectEntity>>(`/manager/collect/item/${voucherId}`),

  createCollect: (collect: Partial<CollectEntity>) =>
    apiClient.post<CollectResponse>("/collect", collect),

  // Deliveries
  getDeliveriesByItem: (voucherId: string) =>
    apiClient.get<QueryResponse<DeliveryEntity>>(`/manager/delivery/item/${voucherId}`),

  createDelivery: (delivery: Partial<DeliveryEntity>) =>
    apiClient.post<DeliveryEntity>("/delivery", delivery),

  // Delete order
  deleteOrder: (id: string) =>
    apiClient.delete<OrderEntity>(`/order/${id}`),

  // Update order
  updateOrder: (id: string, data: Partial<OrderEntity>) =>
    apiClient.put<OrderEntity>(`/order/${id}`, data),

  // Delete item
  deleteItem: (voucherId: string) =>
    apiClient.delete<ItemEntity>(`/item/${voucherId}`),

  // Update item
  updateItem: (voucherId: string, data: Partial<ItemEntity>) =>
    apiClient.put<ItemEntity>(`/item/${voucherId}`, data),

  // File upload
  uploadImage: (file: File) =>
    apiClient.uploadFile("/manager/image/upload", file),

  // Get signed URL by key
  getImageSignedUrl: (key: string) =>
    apiClient.get<string>(`/manager/image/${key}`),
};
