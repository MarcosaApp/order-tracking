import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { message } from "antd";
import { orderService } from "../services/order.service";
import type { CollectEntity, DeliveryEntity } from "../interfaces/entities";

// Query Keys
export const driverKeys = {
  items: (voucherId: string) => ["items", voucherId] as const,
  collects: (voucherId: string) => ["collects", voucherId] as const,
  deliveries: (voucherId: string) => ["deliveries", voucherId] as const,
};

// Search item by voucher ID
export const useSearchItem = () => {
  const [messageApi] = message.useMessage();

  return useMutation({
    mutationFn: (voucherId: string) => orderService.getItemById(voucherId),
    onError: (error: Error) => {
      if (error.message) {
        messageApi.info(error.message);
      } else {
        messageApi.error("Error en la búsqueda");
      }
    },
  });
};

// Get collects for an item
export const useCollects = (voucherId: string, enabled = false) => {
  return useQuery({
    queryKey: driverKeys.collects(voucherId),
    queryFn: () => orderService.getCollectsByItem(voucherId),
    select: (data) => data.items,
    enabled: enabled && !!voucherId,
  });
};

// Create collect
export const useCreateCollect = () => {
  const queryClient = useQueryClient();
  const [messageApi] = message.useMessage();

  return useMutation({
    mutationFn: (collect: Partial<CollectEntity>) =>
      orderService.createCollect(collect),
    onSuccess: (data, variables) => {
      if (variables.voucherId) {
        queryClient.invalidateQueries({
          queryKey: driverKeys.collects(variables.voucherId),
        });
      }
      messageApi.success("Recolecta creada exitosamente");
      return data;
    },
    onError: (error: Error) => {
      messageApi.error(error.message || "Error al crear la recolecta");
    },
  });
};

// Get deliveries for an item
export const useDeliveries = (voucherId: string, enabled = false) => {
  return useQuery({
    queryKey: driverKeys.deliveries(voucherId),
    queryFn: () => orderService.getDeliveriesByItem(voucherId),
    select: (data) => data.items,
    enabled: enabled && !!voucherId,
  });
};

// Create delivery
export const useCreateDelivery = () => {
  const queryClient = useQueryClient();
  const [messageApi] = message.useMessage();

  return useMutation({
    mutationFn: (delivery: Partial<DeliveryEntity>) =>
      orderService.createDelivery(delivery),
    onSuccess: (_data, variables) => {
      if (variables.voucherId) {
        queryClient.invalidateQueries({
          queryKey: driverKeys.deliveries(variables.voucherId),
        });
      }
      messageApi.success("Entrega creada exitosamente");
    },
    onError: (error: Error) => {
      messageApi.error(error.message || "Error al crear la entrega");
    },
  });
};
