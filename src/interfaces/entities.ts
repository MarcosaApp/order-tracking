export interface OrderEntity {
  id: string;
  status?: string | undefined;
  createdAt: number;
  updateAt: number;
}

export interface ItemEntity {
  id: string;
  voucherId: string;
  orderId: string;
  product: string;
  quantity: number;
  collected: number;
  voucherLink?: string;
  status?: string;
  createdAt: number;
  updateAt: number;
}

export interface CollectEntity {
  id?: string;
  voucherId: string;
  driver: string;
  truck: string;
  quantity: number;
  createdAt?: number;
  updateAt?: number;
}

export interface DeliveryEntity {
  id?: string;
  voucherId: string;
  driver: string;
  truck: string;
  quantity: number;
  customer: string;
  voucherLink?: string;
  createdAt?: number;
  updateAt?: number;
}
