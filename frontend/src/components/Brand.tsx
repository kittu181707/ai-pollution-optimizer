import { PRODUCT_NAME } from '../config';

export function Brand() {
  return <div className="brand" aria-label="Product name"><span className="brand-mark" />{PRODUCT_NAME}</div>;
}
