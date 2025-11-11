export interface Banner {
    id: number;
    position: 'hero';
    title?: string;
    subtitle?: string;
    button_text?: string;
    button_link?: string;
    order: number;
    is_active: boolean;
}