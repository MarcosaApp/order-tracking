import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { message } from "antd";
import { orderService } from "../services/order.service";
import type { ItemEntity, OrderEntity } from "../interfaces/entities";

// Query Keys
export const orderKeys = {
  all: ["orders"] as const,
  lists: () => [...orderKeys.all, "list"] as const,
  list: (filters?: any) => [...orderKeys.lists(), filters] as const,
  details: () => [...orderKeys.all, "detail"] as const,
  detail: (id: string) => [...orderKeys.details(), id] as const,
  items: (orderId: string) => [...orderKeys.detail(orderId), "items"] as const,
};

// Get all orders
export const useOrders = () => {
  return useQuery({
    queryKey: orderKeys.lists(),
    queryFn: orderService.getAllOrders,
    select: (data) => data.items,
  });
};

// Create order
export const useCreateOrder = () => {
  const queryClient = useQueryClient();
  const [messageApi] = message.useMessage();

  return useMutation({
    mutationFn: orderService.createOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
      messageApi.success("Orden creada exitosamente");
    },
    onError: (error: Error) => {
      messageApi.error(error.message || "Error al crear la orden");
    },
  });
};

// Get items by order
export const useOrderItems = (orderId: string, enabled = true) => {
  return useQuery({
    queryKey: orderKeys.items(orderId),
    queryFn: () => orderService.getItemsByOrder(orderId),
    select: (data) => data.items,
    enabled: enabled && !!orderId,
  });
};

// Create item
export const useCreateItem = () => {
  const queryClient = useQueryClient();
  const [messageApi] = message.useMessage();

  return useMutation({
    mutationFn: (item: Partial<ItemEntity>) => orderService.createItem(item),
    onSuccess: (data, variables) => {
      // Invalidate the specific order's items
      if (variables.orderId) {
        queryClient.invalidateQueries({
          queryKey: orderKeys.items(variables.orderId),
        });
      }
      messageApi.success("Pedido creado exitosamente");
    },
    onError: (error: Error) => {
      messageApi.error(error.message || "Error al crear el pedido");
    },
  });
};

// Upload image
export const useUploadImage = () => {
  const [messageApi] = message.useMessage();

  return useMutation({
    mutationFn: (file: File) => orderService.uploadImage(file),
    onSuccess: (data, file) => {
      messageApi.success(`${file.name} cargado exitosamente`);
    },
    onError: (error: Error, file) => {
      messageApi.error(`Error al cargar ${file.name}: ${error.message}`);
    },
  });
};
