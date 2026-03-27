export const authRoleOptions = [
  {
    value: 'customer',
    label: 'Customer',
    copy: 'Shop parts, compare options, and place orders for pickup or delivery.',
    meta: 'Storefront access',
    setup: 'Create a customer account to save your details and check out faster on web or mobile.'
  },
  {
    value: 'cashier',
    label: 'Cashier',
    copy: 'Handle counter sales, process payments, and support walk-in customers quickly.',
    meta: 'Counter sales access + security code',
    setup: 'Cashier accounts are issued internally. Sign in with the assigned password and cashier security code.'
  },
  {
    value: 'admin',
    label: 'Admin',
    copy: 'Manage products, monitor stock, review sales, and oversee Charlie PC operations.',
    meta: 'Management access + security code',
    setup: 'Admin accounts are issued internally. Sign in with the assigned password and admin security code.'
  }
];
