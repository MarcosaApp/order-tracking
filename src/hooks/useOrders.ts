import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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

// Get all items with cursor pagination
export const useAllItems = (enabled = true) => {
  return useInfiniteQuery({
    queryKey: ["items", "all"],
    queryFn: ({ pageParam }) =>
      orderService.getAllItems(pageParam as Record<string, any> | undefined),
    initialPageParam: undefined as Record<string, any> | undefined,
    getNextPageParam: (lastPage) => lastPage.cursor ?? undefined,
    enabled,
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
    onSuccess: (_data, variables) => {
      if (variables.orderId) {
        queryClient.invalidateQueries({
          queryKey: orderKeys.items(variables.orderId),
        });
      }
      queryClient.invalidateQueries({ queryKey: ["items", "all"] });
      messageApi.success("Pedido creado exitosamente");
    },
    onError: (error: Error) => {
      messageApi.error(error.message || "Error al crear el pedido");
    },
  });
};

// Get image signed URL
export const useGetImageSignedUrl = () => {
  const [messageApi] = message.useMessage();

  return useMutation({
    mutationFn: (key: string) => orderService.getImageSignedUrl(key),
    onError: (error: Error) => {
      messageApi.error(error.message || "Error al obtener la imagen");
    },
  });
};

// Upload image
export const useUploadImage = () => {
  const [messageApi] = message.useMessage();

  return useMutation({
    mutationFn: (file: File) => orderService.uploadImage(file),
    onSuccess: (_data, file) => {
      messageApi.success(`${file.name} cargado exitosamente`);
    },
    onError: (error: Error, file) => {
      messageApi.error(`Error al cargar ${file.name}: ${error.message}`);
    },
  });
};

// Delete order
export const useDeleteOrder = () => {
  const queryClient = useQueryClient();
  const [messageApi] = message.useMessage();

  return useMutation({
    mutationFn: (id: string) => orderService.deleteOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
      messageApi.success("Orden eliminada exitosamente");
    },
    onError: (error: Error) => {
      messageApi.error(error.message || "Error al eliminar la orden");
    },
  });
};

// Update order
export const useUpdateOrder = () => {
  const queryClient = useQueryClient();
  const [messageApi] = message.useMessage();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<OrderEntity> }) =>
      orderService.updateOrder(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
      messageApi.success("Orden actualizada exitosamente");
    },
    onError: (error: Error) => {
      messageApi.error(error.message || "Error al actualizar la orden");
    },
  });
};

// Delete item
export const useDeleteItem = () => {
  const queryClient = useQueryClient();
  const [messageApi] = message.useMessage();

  return useMutation({
    mutationFn: ({ voucherId }: { voucherId: string; orderId: string }) =>
      orderService.deleteItem(voucherId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: orderKeys.items(variables.orderId),
      });
      queryClient.invalidateQueries({ queryKey: ["items", "all"] });
      messageApi.success("Pedido eliminado exitosamente");
    },
    onError: (error: Error) => {
      messageApi.error(error.message || "Error al eliminar el pedido");
    },
  });
};

// Update item
export const useUpdateItem = () => {
  const queryClient = useQueryClient();
  const [messageApi] = message.useMessage();

  return useMutation({
    mutationFn: ({
      voucherId,
      data,
    }: {
      voucherId: string;
      orderId: string;
      data: Partial<ItemEntity>;
    }) => orderService.updateItem(voucherId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: orderKeys.items(variables.orderId),
      });
      queryClient.invalidateQueries({ queryKey: ["items", "all"] });
      messageApi.success("Pedido actualizado exitosamente");
    },
    onError: (error: Error) => {
      messageApi.error(error.message || "Error al actualizar el pedido");
    },
  });
};
