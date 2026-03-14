import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Dialog, Divider, HelperText, Portal, Snackbar, Text, TextInput } from 'react-native-paper';
import { createSale } from '../api/client';
import { API_BASE_URL } from '../constants/config';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatNumber } from '../utils/format';
import {
  CHECKOUT_DEFAULTS,
  composeDeliveryAddress,
  getBarangayOptions,
  getMunicipalityOptions,
  getProvinceOptions,
  getSelectedMunicipality,
  isValidPhilippinePhone,
  isValidStandardEmail,
  normalizeEmail,
  normalizePhilippinePhone
} from '../utils/customerForm';
import { useResponsiveLayout } from '../utils/responsive';

const FULFILLMENT_OPTIONS = [
  { value: 'delivery', title: 'Delivery', copy: 'Free local delivery' },
  { value: 'pickup', title: 'Store Pickup', copy: 'Collect from the shop' }
];

const POS_PAYMENT_OPTIONS = [
  { value: 'Cash', title: 'Cash', copy: 'Accept cash and give change' },
  { value: 'Card', title: 'Card', copy: 'Use card terminal' },
  { value: 'GCash', title: 'GCash', copy: 'Receive e-wallet payment' }
];

const ONLINE_PAYMENT_OPTIONS = [
  { value: 'Card', title: 'Card', copy: 'Credit or debit card' },
  { value: 'GCash', title: 'GCash', copy: 'Manual GCash confirmation' },
  { value: 'Cash on Delivery', title: 'Cash on Delivery', copy: 'Pay the rider on arrival' }
];

const QUICK_TENDER_VALUES = [200, 500, 1000, 2000];
const CASH_KEYPAD_VALUES = ['7', '8', '9', '4', '5', '6', '1', '2', '3', '00', '0', '.'];

function digitsOnly(value) {
  return String(value || '').replace(/\D/g, '');
}

function normalizeCashInput(value) {
  const raw = String(value ?? '').replace(/[^\d.]/g, '');
  if (!raw) return '';
  const [whole, ...fractionParts] = raw.split('.');
  const normalizedWhole = whole.replace(/^0+(?=\d)/, '');
  const fraction = fractionParts.join('').slice(0, 2);
  if (raw.includes('.')) {
    return `${normalizedWhole || '0'}.${fraction}`;
  }
  return normalizedWhole;
}

function formatCardNumber(value) {
  return digitsOnly(value).slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
}

function formatExpiry(value) {
  const raw = digitsOnly(value).slice(0, 4);
  if (raw.length < 3) return raw;
  return `${raw.slice(0, 2)}/${raw.slice(2)}`;
}

function buildInitialForm(user) {
  return {
    ...CHECKOUT_DEFAULTS,
    customerName: user?.name || '',
    customerEmail: user?.email || ''
  };
}

function ChoiceCard({ active, title, copy, onPress, style }) {
  return (
    <Pressable onPress={onPress} style={[styles.choiceCard, style, active && styles.choiceCardActive]}>
      <Text variant="titleSmall" style={styles.choiceTitle}>{title}</Text>
      <Text style={styles.choiceCopy}>{copy}</Text>
    </Pressable>
  );
}

export default function CartScreen() {
  const { items, subtotal, removeItem, updateQuantity, clearCart } = useCart();
  const { token, user } = useAuth();
  const layout = useResponsiveLayout();
  const isPosCheckout = user?.role === 'admin' || user?.role === 'cashier';
  const [paymentMethod, setPaymentMethod] = useState(isPosCheckout ? 'Cash' : 'Card');
  const [amountTendered, setAmountTendered] = useState('');
  const [orderForm, setOrderForm] = useState(() => buildInitialForm(user));
  const [addressTree, setAddressTree] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [snack, setSnack] = useState('');
  const [receipt, setReceipt] = useState(null);
  const [checkoutErrors, setCheckoutErrors] = useState({});

  useEffect(() => {
    setPaymentMethod(isPosCheckout ? 'Cash' : 'Card');
    setAmountTendered('');
    setOrderForm(buildInitialForm(user));
    setCheckoutErrors({});
  }, [isPosCheckout, user?.name, user?.email]);

  useEffect(() => {
    loadAddressTree();
  }, []);

  const tenderedValue = Number(amountTendered || 0);
  const totalItems = useMemo(() => items.reduce((sum, item) => sum + Number(item.quantity || 0), 0), [items]);
  const paymentOptions = isPosCheckout
    ? POS_PAYMENT_OPTIONS
    : ONLINE_PAYMENT_OPTIONS.filter((option) => !(orderForm.fulfillmentType === 'pickup' && option.value === 'Cash on Delivery'));
  const provinceOptions = useMemo(() => getProvinceOptions(addressTree, orderForm.regionCode), [addressTree, orderForm.regionCode]);
  const municipalityOptions = useMemo(
    () => getMunicipalityOptions(addressTree, orderForm.regionCode, orderForm.provinceName),
    [addressTree, orderForm.regionCode, orderForm.provinceName]
  );
  const barangayOptions = useMemo(
    () => getBarangayOptions(addressTree, orderForm.regionCode, orderForm.provinceName, orderForm.municipalityName),
    [addressTree, orderForm.regionCode, orderForm.provinceName, orderForm.municipalityName]
  );
  const selectedMunicipality = useMemo(
    () => getSelectedMunicipality(addressTree, orderForm.regionCode, orderForm.provinceName, orderForm.municipalityName),
    [addressTree, orderForm.regionCode, orderForm.provinceName, orderForm.municipalityName]
  );

  async function loadAddressTree() {
    try {
      const res = await fetch(`${API_BASE_URL}/reference/ph-addresses`);
      const data = await res.json();
      setAddressTree(Array.isArray(data) ? data : []);
    } catch (e) {
      setAddressTree([]);
    }
  }

  function clearCheckoutErrors(fields) {
    const fieldList = Array.isArray(fields) ? fields : [fields];
    setCheckoutErrors((prev) => {
      if (!prev || Object.keys(prev).length === 0) return prev;
      const next = { ...prev };
      let changed = false;
      for (const field of fieldList) {
        if (field && Object.prototype.hasOwnProperty.call(next, field)) {
          delete next[field];
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }

  function updateOrderField(field, value) {
    setOrderForm((prev) => ({ ...prev, [field]: value }));
    clearCheckoutErrors(field);
  }

  function selectRegion(value) {
    setOrderForm((prev) => ({
      ...prev,
      regionCode: value,
      provinceName: '',
      municipalityName: '',
      barangayName: '',
      postalCode: ''
    }));
    clearCheckoutErrors(['regionCode', 'provinceName', 'municipalityName', 'barangayName', 'postalCode']);
  }

  function selectProvince(value) {
    setOrderForm((prev) => ({
      ...prev,
      provinceName: value,
      municipalityName: '',
      barangayName: '',
      postalCode: ''
    }));
    clearCheckoutErrors(['provinceName', 'municipalityName', 'barangayName', 'postalCode']);
  }

  function selectMunicipality(value) {
    const municipality = getSelectedMunicipality(addressTree, orderForm.regionCode, orderForm.provinceName, value);
    setOrderForm((prev) => ({
      ...prev,
      municipalityName: value,
      barangayName: '',
      postalCode: municipality?.postalCode || ''
    }));
    clearCheckoutErrors(['municipalityName', 'barangayName', 'postalCode']);
  }

  function selectFulfillmentType(value) {
    setOrderForm((prev) => ({
      ...prev,
      fulfillmentType: value,
      paymentMethod: value === 'pickup' && paymentMethod === 'Cash on Delivery' ? 'Card' : prev.paymentMethod,
      ...(value === 'pickup'
        ? {
            regionCode: '',
            provinceName: '',
            municipalityName: '',
            barangayName: '',
            postalCode: '',
            deliveryAddress: '',
            landmark: ''
          }
        : {})
    }));
    if (value === 'pickup' && paymentMethod === 'Cash on Delivery') {
      setPaymentMethod('Card');
    }
    clearCheckoutErrors(['fulfillmentType', 'paymentMethod', 'regionCode', 'provinceName', 'municipalityName', 'barangayName', 'postalCode', 'deliveryAddress']);
  }

  function selectPaymentMethod(value) {
    setPaymentMethod(value);
    setOrderForm((prev) => ({
      ...prev,
      paymentMethod: value,
      paymentReference: value === 'GCash' ? prev.paymentReference : '',
      cardHolder: value === 'Card' ? prev.cardHolder : '',
      cardNumber: value === 'Card' ? prev.cardNumber : '',
      cardExpiry: value === 'Card' ? prev.cardExpiry : '',
      cardCvv: value === 'Card' ? prev.cardCvv : ''
    }));
    clearCheckoutErrors(['paymentMethod', 'amountTendered', 'paymentReference', 'cardHolder', 'cardNumber', 'cardExpiry', 'cardCvv', 'gcashNumber']);
  }

  function appendTenderValue(value) {
    setPaymentMethod('Cash');
    setAmountTendered((prev) => {
      if (value === '.' && String(prev || '').includes('.')) return prev;
      const base = String(prev || '');
      const next = value === '.' && !base ? '0.' : `${base}${value}`;
      return normalizeCashInput(next);
    });
    clearCheckoutErrors('amountTendered');
  }

  function backspaceTender() {
    setAmountTendered((prev) => normalizeCashInput(String(prev || '').slice(0, -1)));
    clearCheckoutErrors('amountTendered');
  }

  function applyQuickTender(amount) {
    setPaymentMethod('Cash');
    setAmountTendered(String(Number(amount || 0).toFixed(2)));
    clearCheckoutErrors('amountTendered');
  }

  function collectCheckoutErrors() {
    const errors = {};
    if (items.length === 0) errors.cart = 'Your cart is empty.';
    if (isPosCheckout) {
      if (paymentMethod === 'Cash' && tenderedValue < subtotal) errors.amountTendered = 'Cash received is not enough.';
      return errors;
    }
    if (!orderForm.customerName.trim()) errors.customerName = 'Enter the customer name.';
    if (!isValidPhilippinePhone(orderForm.customerPhone)) errors.customerPhone = 'Enter a valid Philippine mobile number.';
    if (orderForm.customerEmail && !isValidStandardEmail(orderForm.customerEmail)) errors.customerEmail = 'Enter a valid email address.';
    if (orderForm.fulfillmentType === 'delivery') {
      if (!orderForm.regionCode) errors.regionCode = 'Select the region.';
      if (!orderForm.provinceName) errors.provinceName = 'Select the province.';
      if (!orderForm.municipalityName) errors.municipalityName = 'Select the municipality or city.';
      if (!orderForm.barangayName) errors.barangayName = 'Select the barangay.';
      if (!selectedMunicipality?.postalCode) errors.postalCode = 'Postal code is unavailable for the selected area.';
      if (!orderForm.deliveryAddress.trim()) errors.deliveryAddress = 'Enter the house number, street, or building.';
    }
    if (paymentMethod === 'Card') {
      if (!orderForm.cardHolder.trim()) errors.cardHolder = 'Enter the card holder name.';
      if (digitsOnly(orderForm.cardNumber).length !== 16) errors.cardNumber = 'Enter a valid 16-digit card number.';
      if (!/^\d{2}\/\d{2}$/.test(orderForm.cardExpiry)) errors.cardExpiry = 'Enter the card expiry as MM/YY.';
      if (digitsOnly(orderForm.cardCvv).length < 3) errors.cardCvv = 'Enter a valid card CVV.';
    }
    if (paymentMethod === 'GCash') {
      if (!isValidPhilippinePhone(orderForm.gcashNumber || orderForm.customerPhone)) errors.gcashNumber = 'Enter the GCash number.';
      if (!orderForm.paymentReference.trim()) errors.paymentReference = 'Enter the GCash reference number.';
    }
    if (paymentMethod === 'Cash on Delivery' && orderForm.fulfillmentType !== 'delivery') {
      errors.paymentMethod = 'Cash on Delivery is only available for delivery orders.';
    }
    return errors;
  }

  function firstCheckoutError(errors) {
    return Object.values(errors)[0] || '';
  }

  async function checkout() {
    const validationErrors = collectCheckoutErrors();
    if (Object.keys(validationErrors).length > 0) {
      setCheckoutErrors(validationErrors);
      setSnack(firstCheckoutError(validationErrors));
      return;
    }

    setCheckoutErrors({});
    setProcessing(true);
    try {
      const payload = isPosCheckout
        ? {
            saleChannel: 'pos',
            paymentMethod,
            amountTendered: paymentMethod === 'Cash' ? tenderedValue : undefined,
            items: items.map((item) => ({ id: item.id, quantity: item.quantity }))
          }
        : {
            saleChannel: 'online',
            paymentMethod,
            fulfillmentType: orderForm.fulfillmentType,
            customerName: orderForm.customerName.trim(),
            customerPhone: normalizePhilippinePhone(orderForm.customerPhone),
            customerEmail: normalizeEmail(orderForm.customerEmail),
            deliveryAddress: orderForm.fulfillmentType === 'delivery' ? composeDeliveryAddress(orderForm, addressTree) : '',
            paymentReference: paymentMethod === 'GCash' ? orderForm.paymentReference.trim() : '',
            cardNumber: paymentMethod === 'Card' ? digitsOnly(orderForm.cardNumber) : '',
            items: items.map((item) => ({ id: item.id, quantity: item.quantity }))
          };

      const result = await createSale(payload, token || undefined);
      clearCart();
      setAmountTendered('');
      setReceipt(result?.receipt || null);
      setSnack(result?.receiptNumber ? `Checkout complete: ${result.receiptNumber}` : `Sale submitted (ID: ${result.saleId || 'n/a'})`);
      if (!isPosCheckout) {
        setOrderForm((prev) => ({
          ...buildInitialForm(user),
          customerPhone: prev.customerPhone,
          regionCode: prev.regionCode,
          provinceName: prev.provinceName,
          municipalityName: prev.municipalityName,
          barangayName: prev.barangayName,
          postalCode: prev.postalCode,
          deliveryAddress: prev.deliveryAddress,
          landmark: prev.landmark
        }));
      }
    } catch (e) {
      setSnack(e.message || 'Checkout failed');
    } finally {
      setProcessing(false);
    }
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingHorizontal: layout.screenPadding, alignSelf: 'center', width: '100%', maxWidth: layout.maxContentWidth }
      ]}
    >
      <Card style={styles.heroCard}>
        <Card.Content>
          <Text style={styles.eyebrow}>{isPosCheckout ? 'Charlie PC Counter Sale' : 'Charlie PC Mobile'}</Text>
          <Text variant="headlineSmall" style={styles.heroTitle}>{isPosCheckout ? 'Finalize the counter transaction' : 'Review your cart before placing the order'}</Text>
          <Text style={styles.heroCopy}>{isPosCheckout ? 'Review the basket, use the cash keypad when needed, and confirm the payment with confidence.' : 'Capture customer details, choose delivery, and complete payment with a real-world flow.'}</Text>
        </Card.Content>
      </Card>

      <Card style={styles.sectionCard}>
        <Card.Title title="Order Summary" subtitle={`${formatNumber(totalItems)} item(s) in cart`} />
        <Card.Content>
          {items.length === 0 ? <Text style={styles.empty}>No items in cart yet.</Text> : null}
          {items.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <View style={styles.itemCopy}>
                <Text variant="titleMedium">{item.name}</Text>
                <Text style={styles.itemMeta}>{formatCurrency(item.price || 0)} each</Text>
              </View>
              <View style={styles.itemActions}>
                <View style={styles.qtyPill}>
                  <Button compact onPress={() => updateQuantity(item.id, item.quantity - 1)}>-</Button>
                  <Text variant="titleSmall">{formatNumber(item.quantity)}</Text>
                  <Button compact onPress={() => updateQuantity(item.id, item.quantity + 1)}>+</Button>
                </View>
                <Text variant="labelLarge">{formatCurrency(Number(item.price || 0) * Number(item.quantity || 0))}</Text>
                <Button compact onPress={() => removeItem(item.id)}>Remove</Button>
              </View>
            </View>
          ))}
        </Card.Content>
      </Card>

      {!isPosCheckout ? (
        <Card style={styles.sectionCard}>
          <Card.Title title="Delivery Details" subtitle="Tell us who should receive this order" />
          <Card.Content>
            <View style={styles.choiceGrid}>
              {FULFILLMENT_OPTIONS.map((option) => (
              <ChoiceCard
                key={option.value}
                active={orderForm.fulfillmentType === option.value}
                title={option.title}
                copy={option.copy}
                style={layout.isTwoPane ? styles.choiceCardWide : undefined}
                onPress={() => selectFulfillmentType(option.value)}
              />
              ))}
            </View>

            <TextInput mode="outlined" label="Full Name" value={orderForm.customerName} onChangeText={(value) => updateOrderField('customerName', value)} style={styles.input} error={Boolean(checkoutErrors.customerName)} />
            <HelperText type="error" visible={Boolean(checkoutErrors.customerName)}>{checkoutErrors.customerName}</HelperText>
            <TextInput mode="outlined" label="Mobile Number" value={orderForm.customerPhone} onChangeText={(value) => updateOrderField('customerPhone', normalizePhilippinePhone(value))} style={styles.input} error={Boolean(checkoutErrors.customerPhone)} />
            <HelperText type="error" visible={Boolean(checkoutErrors.customerPhone)}>{checkoutErrors.customerPhone}</HelperText>
            <TextInput mode="outlined" label="Email Address (Optional)" value={orderForm.customerEmail} onChangeText={(value) => updateOrderField('customerEmail', value)} style={styles.input} error={Boolean(checkoutErrors.customerEmail)} />
            <HelperText type="error" visible={Boolean(checkoutErrors.customerEmail)}>{checkoutErrors.customerEmail}</HelperText>
            {orderForm.fulfillmentType === 'delivery' ? (
              <>
                <Text style={[styles.selectorLabel, checkoutErrors.regionCode && styles.selectorLabelError]}>Region</Text>
                <View style={styles.choiceGrid}>
                  {addressTree.map((region) => (
                    <ChoiceCard
                      key={region.code}
                      active={orderForm.regionCode === region.code}
                      title={region.name}
                      copy="Select region"
                      style={layout.isTwoPane ? styles.choiceCardWide : undefined}
                      onPress={() => selectRegion(region.code)}
                    />
                  ))}
                </View>
                <HelperText type="error" visible={Boolean(checkoutErrors.regionCode)}>{checkoutErrors.regionCode}</HelperText>

                <Text style={[styles.selectorLabel, checkoutErrors.provinceName && styles.selectorLabelError]}>Province</Text>
                <View style={styles.choiceGrid}>
                  {provinceOptions.map((province) => (
                    <ChoiceCard
                      key={province.name}
                      active={orderForm.provinceName === province.name}
                      title={province.name}
                      copy="Select province"
                      style={layout.isTwoPane ? styles.choiceCardWide : undefined}
                      onPress={() => selectProvince(province.name)}
                    />
                  ))}
                </View>
                <HelperText type="error" visible={Boolean(checkoutErrors.provinceName)}>{checkoutErrors.provinceName}</HelperText>

                <Text style={[styles.selectorLabel, checkoutErrors.municipalityName && styles.selectorLabelError]}>Municipality / City</Text>
                <View style={styles.choiceGrid}>
                  {municipalityOptions.map((municipality) => (
                    <ChoiceCard
                      key={municipality.name}
                      active={orderForm.municipalityName === municipality.name}
                      title={municipality.name}
                      copy={`Postal code ${municipality.postalCode}`}
                      style={layout.isTwoPane ? styles.choiceCardWide : undefined}
                      onPress={() => selectMunicipality(municipality.name)}
                    />
                  ))}
                </View>
                <HelperText type="error" visible={Boolean(checkoutErrors.municipalityName)}>{checkoutErrors.municipalityName}</HelperText>

                <Text style={[styles.selectorLabel, checkoutErrors.barangayName && styles.selectorLabelError]}>Barangay</Text>
                <View style={styles.choiceGrid}>
                  {barangayOptions.map((barangay) => (
                    <ChoiceCard
                      key={barangay}
                      active={orderForm.barangayName === barangay}
                      title={barangay}
                      copy="Select barangay"
                      style={layout.isTwoPane ? styles.choiceCardWide : undefined}
                      onPress={() => updateOrderField('barangayName', barangay)}
                    />
                  ))}
                </View>
                <HelperText type="error" visible={Boolean(checkoutErrors.barangayName)}>{checkoutErrors.barangayName}</HelperText>

                <TextInput mode="outlined" label="Postal Code" value={selectedMunicipality?.postalCode || orderForm.postalCode} editable={false} style={styles.input} error={Boolean(checkoutErrors.postalCode)} />
                <HelperText type="error" visible={Boolean(checkoutErrors.postalCode)}>{checkoutErrors.postalCode}</HelperText>
                <TextInput mode="outlined" label="House No. / Street / Building" value={orderForm.deliveryAddress} onChangeText={(value) => updateOrderField('deliveryAddress', value)} style={styles.input} error={Boolean(checkoutErrors.deliveryAddress)} />
                <HelperText type="error" visible={Boolean(checkoutErrors.deliveryAddress)}>{checkoutErrors.deliveryAddress}</HelperText>
                <TextInput mode="outlined" label="Landmark" value={orderForm.landmark} onChangeText={(value) => updateOrderField('landmark', value)} style={styles.input} />
                <Text style={styles.noteCopy}>Delivery follows the Philippine address order: region, province, municipality or city, barangay, postal code, then the exact street details and landmark.</Text>
              </>
            ) : (
              <View style={styles.noteCard}>
                <Text variant="titleSmall">Store Pickup</Text>
                <Text style={styles.noteCopy}>We will notify the customer once the order is ready for pickup.</Text>
              </View>
            )}
          </Card.Content>
        </Card>
      ) : null}

      <Card style={styles.sectionCard}>
        <Card.Title title="Payment" subtitle={isPosCheckout ? 'Choose how the customer is paying' : 'Select the payment channel'} />
        <Card.Content>
          <View style={styles.choiceGrid}>
            {paymentOptions.map((option) => (
              <ChoiceCard
                key={option.value}
                active={paymentMethod === option.value}
                title={option.title}
                copy={option.copy}
                style={layout.isTwoPane ? styles.choiceCardWide : undefined}
                onPress={() => selectPaymentMethod(option.value)}
              />
            ))}
          </View>

          {isPosCheckout && paymentMethod === 'Cash' ? (
            <View style={styles.posCashPanel}>
              <Text style={styles.cashLabel}>Cash Received</Text>
              <View style={styles.posCashDisplay}>
                <Text style={styles.posCashDisplayText}>{amountTendered || '0.00'}</Text>
              </View>
              <View style={styles.cashQuickGrid}>
                {QUICK_TENDER_VALUES.map((amount) => (
                  <Button key={amount} mode="outlined" compact onPress={() => applyQuickTender(amount)} style={styles.cashQuickBtn}>
                    {formatCurrency(amount, 0)}
                  </Button>
                ))}
                <Button mode="outlined" compact onPress={() => applyQuickTender(subtotal)} style={styles.cashQuickBtn}>
                  Exact
                </Button>
              </View>
              <View style={styles.cashKeypadGrid}>
                {CASH_KEYPAD_VALUES.map((value) => (
                  <Button key={value} mode="contained-tonal" compact onPress={() => appendTenderValue(value)} style={styles.cashKeypadBtn}>
                    {value}
                  </Button>
                ))}
                <Button mode="outlined" compact onPress={backspaceTender} style={styles.cashKeypadBtn}>
                  Back
                </Button>
                <Button mode="outlined" compact onPress={() => setAmountTendered('')} style={styles.cashKeypadBtn}>
                  Clear
                </Button>
              </View>
              <TextInput
                mode="outlined"
                label="Manual Cash Amount"
                keyboardType="decimal-pad"
                value={amountTendered}
                onChangeText={(value) => {
                  setAmountTendered(normalizeCashInput(value));
                  clearCheckoutErrors('amountTendered');
                }}
                style={styles.input}
                error={Boolean(checkoutErrors.amountTendered)}
              />
              <HelperText type="error" visible={Boolean(checkoutErrors.amountTendered)}>{checkoutErrors.amountTendered}</HelperText>
              <View style={[styles.changeCard, tenderedValue < subtotal ? styles.changeCardShort : styles.changeCardReady]}>
                <Text style={styles.changeLabel}>{tenderedValue < subtotal ? 'Still Needed' : 'Change Due'}</Text>
                <Text style={styles.changeValue}>{formatCurrency(Math.abs(tenderedValue - subtotal))}</Text>
              </View>
            </View>
          ) : null}

          {!isPosCheckout && paymentMethod === 'Card' ? (
            <>
              <View style={styles.cardPreview}>
                <Text style={styles.cardPreviewLabel}>Card Payment</Text>
                <Text style={styles.cardPreviewNumber}>{formatCardNumber(orderForm.cardNumber) || '0000 0000 0000 0000'}</Text>
                <View style={styles.cardPreviewMeta}>
                  <Text style={styles.cardPreviewText}>{orderForm.cardHolder || 'Card Holder'}</Text>
                  <Text style={styles.cardPreviewText}>{orderForm.cardExpiry || 'MM/YY'}</Text>
                </View>
              </View>
              <TextInput mode="outlined" label="Card Holder" value={orderForm.cardHolder} onChangeText={(value) => updateOrderField('cardHolder', value)} style={styles.input} error={Boolean(checkoutErrors.cardHolder)} />
              <HelperText type="error" visible={Boolean(checkoutErrors.cardHolder)}>{checkoutErrors.cardHolder}</HelperText>
              <TextInput mode="outlined" label="Card Number" value={orderForm.cardNumber} onChangeText={(value) => updateOrderField('cardNumber', formatCardNumber(value))} keyboardType="number-pad" style={styles.input} error={Boolean(checkoutErrors.cardNumber)} />
              <HelperText type="error" visible={Boolean(checkoutErrors.cardNumber)}>{checkoutErrors.cardNumber}</HelperText>
              <View style={layout.stackedInputs ? styles.twoColStack : styles.twoCol}>
                <TextInput mode="outlined" label="Expiry (MM/YY)" value={orderForm.cardExpiry} onChangeText={(value) => updateOrderField('cardExpiry', formatExpiry(value))} keyboardType="number-pad" style={[styles.input, styles.col]} error={Boolean(checkoutErrors.cardExpiry)} />
                <TextInput mode="outlined" label="CVV" value={orderForm.cardCvv} onChangeText={(value) => updateOrderField('cardCvv', digitsOnly(value).slice(0, 4))} keyboardType="number-pad" style={[styles.input, styles.col]} error={Boolean(checkoutErrors.cardCvv)} />
              </View>
              <HelperText type="error" visible={Boolean(checkoutErrors.cardExpiry)}>{checkoutErrors.cardExpiry}</HelperText>
              <HelperText type="error" visible={Boolean(checkoutErrors.cardCvv)}>{checkoutErrors.cardCvv}</HelperText>
              <Text style={styles.noteCopy}>Only the masked last four digits are retained on the server.</Text>
            </>
          ) : null}

          {!isPosCheckout && paymentMethod === 'GCash' ? (
            <>
              <View style={styles.noteCard}>
                <Text variant="titleSmall">GCash Payment</Text>
                <Text style={styles.noteCopy}>Use the customer GCash account to send payment, then enter the reference number for confirmation.</Text>
              </View>
              <TextInput mode="outlined" label="GCash Number" value={orderForm.gcashNumber} onChangeText={(value) => updateOrderField('gcashNumber', normalizePhilippinePhone(value))} style={styles.input} error={Boolean(checkoutErrors.gcashNumber)} />
              <HelperText type="error" visible={Boolean(checkoutErrors.gcashNumber)}>{checkoutErrors.gcashNumber}</HelperText>
              <TextInput mode="outlined" label="Reference Number" value={orderForm.paymentReference} onChangeText={(value) => updateOrderField('paymentReference', value.toUpperCase())} style={styles.input} error={Boolean(checkoutErrors.paymentReference)} />
              <HelperText type="error" visible={Boolean(checkoutErrors.paymentReference)}>{checkoutErrors.paymentReference}</HelperText>
            </>
          ) : null}

          {!isPosCheckout && paymentMethod === 'Cash on Delivery' ? (
            <View style={styles.noteCard}>
              <Text variant="titleSmall">Cash on Delivery</Text>
              <Text style={styles.noteCopy}>The customer pays the rider upon arrival. Remind them to prepare exact cash if possible.</Text>
            </View>
          ) : null}
        </Card.Content>
      </Card>

      <Card style={styles.totalCard}>
        <Card.Content>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>{formatCurrency(subtotal)}</Text>
          </View>
          {!isPosCheckout ? (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Fulfillment</Text>
              <Text style={styles.totalValue}>{orderForm.fulfillmentType === 'delivery' ? 'Free delivery' : 'Store pickup'}</Text>
            </View>
          ) : null}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>{!isPosCheckout && paymentMethod === 'Cash on Delivery' ? 'Amount Due on Delivery' : 'Amount Due'}</Text>
            <Text style={styles.totalValueStrong}>{formatCurrency(subtotal)}</Text>
          </View>
          <Button mode="contained" onPress={checkout} loading={processing} disabled={processing || items.length === 0} style={styles.checkoutButton}>
            {processing ? 'Processing...' : isPosCheckout ? `Process ${paymentMethod} Payment` : !isPosCheckout && paymentMethod === 'Cash on Delivery' ? 'Place Delivery Order' : 'Checkout'}
          </Button>
          <HelperText type="error" visible={Boolean(checkoutErrors.paymentMethod)}>{checkoutErrors.paymentMethod}</HelperText>
        </Card.Content>
      </Card>

      <Portal>
        <Dialog visible={Boolean(receipt)} onDismiss={() => setReceipt(null)} style={layout.isExpanded ? styles.dialogWide : undefined}>
          <Dialog.Title>{receipt ? receipt.receiptNumber || `Sale #${receipt.id}` : 'Receipt'}</Dialog.Title>
          <Dialog.Content>
            {receipt ? (
              <>
                <Text>Total: {formatCurrency(receipt.total || 0)}</Text>
                <Text style={styles.meta}>Payment: {receipt.paymentMethod || '-'}</Text>
                <Text style={styles.meta}>Status: {receipt.status || 'completed'}</Text>
                <Text style={styles.meta}>Date: {receipt.createdAt ? new Date(receipt.createdAt).toLocaleString() : '-'}</Text>
                {(receipt.customerName || receipt.customer_name) ? <Text style={styles.meta}>Customer: {receipt.customerName || receipt.customer_name}</Text> : null}
                {(receipt.customerPhone || receipt.customer_phone) ? <Text style={styles.meta}>Phone: {receipt.customerPhone || receipt.customer_phone}</Text> : null}
                {(receipt.deliveryAddress || receipt.delivery_address) ? <Text style={styles.meta}>Address: {receipt.deliveryAddress || receipt.delivery_address}</Text> : null}
                {(receipt.paymentReference || receipt.payment_reference || receipt.paymentLast4 || receipt.payment_last4) ? (
                  <Text style={styles.meta}>Reference: {receipt.paymentReference || receipt.payment_reference || `Card ending in ${receipt.paymentLast4 || receipt.payment_last4}`}</Text>
                ) : null}
                <Divider style={styles.divider} />
                {(receipt.items || []).map((item, idx) => (
                  <Text key={`${item.id || idx}-${idx}`} style={styles.itemReceiptRow}>
                    {(item.productName || item.product_name || 'Item')} x {formatNumber(item.quantity)} = {formatCurrency(item.lineTotal || item.line_total || 0)}
                  </Text>
                ))}
                <Divider style={styles.divider} />
                <Text>Subtotal: {formatCurrency(receipt.subtotal || 0)}</Text>
                <Text>{receipt.paymentMethod === 'Cash on Delivery' ? 'Due on Delivery' : 'Paid'}: {formatCurrency(receipt.amountTendered || receipt.amount_tendered || receipt.total || 0)}</Text>
                <Text>Change: {formatCurrency(receipt.changeAmount || receipt.change_amount || 0)}</Text>
              </>
            ) : null}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setReceipt(null)}>Close</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Snackbar visible={Boolean(snack)} onDismiss={() => setSnack('')} duration={2400}>
        {snack}
      </Snackbar>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EEF2F8'
  },
  content: {
    padding: 12,
    gap: 12,
    paddingBottom: 28
  },
  heroCard: {
    borderRadius: 24,
    backgroundColor: '#163567'
  },
  eyebrow: {
    color: '#BFD4FF',
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    fontSize: 12
  },
  heroTitle: {
    marginTop: 6,
    color: '#FFFFFF'
  },
  heroCopy: {
    marginTop: 8,
    color: '#D9E5FF',
    lineHeight: 20
  },
  sectionCard: {
    borderRadius: 22
  },
  choiceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 12
  },
  choiceCard: {
    width: '100%',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#D9E2F1',
    backgroundColor: '#F8FAFE',
    padding: 14
  },
  choiceCardWide: {
    width: '48.8%'
  },
  choiceCardActive: {
    borderColor: '#2257BA',
    backgroundColor: '#ECF3FF'
  },
  choiceTitle: {
    color: '#18335F'
  },
  choiceCopy: {
    marginTop: 4,
    color: '#61708B',
    lineHeight: 18
  },
  selectorLabel: {
    marginTop: 4,
    marginBottom: 8,
    color: '#18335F',
    fontWeight: '700'
  },
  selectorLabelError: {
    color: '#B42318'
  },
  input: {
    marginBottom: 10,
    backgroundColor: '#FFFFFF'
  },
  noteCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#D9E2F1',
    backgroundColor: '#F8FAFE',
    padding: 14,
    marginBottom: 10
  },
  noteCopy: {
    marginTop: 4,
    color: '#61708B',
    lineHeight: 18
  },
  posCashPanel: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D9E2F1',
    backgroundColor: '#F8FAFE',
    padding: 14,
    marginBottom: 10
  },
  cashLabel: {
    color: '#18335F',
    fontWeight: '700',
    marginBottom: 8
  },
  posCashDisplay: {
    minHeight: 72,
    borderRadius: 18,
    backgroundColor: '#0F2447',
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingHorizontal: 16,
    marginBottom: 12
  },
  posCashDisplayText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 1
  },
  cashQuickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10
  },
  cashQuickBtn: {
    minWidth: 92
  },
  cashKeypadGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10
  },
  cashKeypadBtn: {
    width: '31%'
  },
  changeCard: {
    marginTop: 2,
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  changeCardReady: {
    borderColor: '#B8E3C8',
    backgroundColor: '#EAF7EF'
  },
  changeCardShort: {
    borderColor: '#F0D4A7',
    backgroundColor: '#FFF4E8'
  },
  changeLabel: {
    color: '#61708B',
    fontWeight: '600'
  },
  changeValue: {
    color: '#18335F',
    fontSize: 18,
    fontWeight: '700'
  },
  itemRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ECF0F7'
  },
  itemCopy: {
    marginBottom: 10
  },
  itemMeta: {
    color: '#667085',
    marginTop: 2
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    flexWrap: 'wrap'
  },
  qtyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#D8E1EF',
    paddingHorizontal: 4,
    backgroundColor: '#F8FAFE'
  },
  cardPreview: {
    borderRadius: 20,
    backgroundColor: '#14376B',
    padding: 16,
    marginBottom: 12
  },
  cardPreviewLabel: {
    color: '#BFD4FF',
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontSize: 12,
    fontWeight: '700'
  },
  cardPreviewNumber: {
    marginTop: 16,
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 2
  },
  cardPreviewMeta: {
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8
  },
  cardPreviewText: {
    color: '#D9E5FF'
  },
  twoCol: {
    flexDirection: 'row',
    gap: 10
  },
  twoColStack: {
    gap: 0
  },
  col: {
    flex: 1
  },
  totalCard: {
    borderRadius: 22,
    backgroundColor: '#102852'
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  totalLabel: {
    color: '#D8E2F5'
  },
  totalValue: {
    color: '#FFFFFF'
  },
  totalValueStrong: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700'
  },
  checkoutButton: {
    marginTop: 8
  },
  divider: {
    marginVertical: 8
  },
  itemReceiptRow: {
    marginTop: 4
  },
  meta: {
    color: '#667085',
    marginTop: 2
  },
  empty: {
    textAlign: 'center',
    color: '#667085',
    marginTop: 12
  },
  dialogWide: {
    alignSelf: 'center',
    width: 720
  }
});
