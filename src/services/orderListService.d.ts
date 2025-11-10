export interface Order {
    id: number;
    supplier_id?: number;
    product_id?: number;
    name?: string;
    description?: string;
    quantity?: number;
    price?: number;
    meet_id?: string;
}
export declare const orderListService: {
    getAll(): Promise<Order[]>;
    insertOne(payload: Partial<Order>): Promise<Order | null>;
    updateById(id: string | number, updates: Partial<Order>): Promise<Order | null>;
    deleteById(id: string | number): Promise<boolean>;
};
