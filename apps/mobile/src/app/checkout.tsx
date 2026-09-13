import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import * as Haptics from 'expo-haptics';
import {
  Feather,
  Ionicons,
  MaterialIcons,
} from '@expo/vector-icons';

import { LogoColors, Fonts, Spacing, BorderRadius } from '@/constants/theme';
import { useStore } from '@/context/StoreContext';
import {
  CreateOrderSchema,
  validateData,
  resolveImageUrl,
  normalizeEthiopianPhone,
  EthiopianPhoneRegex,
} from '@astu/shared';
import { apiClient } from '@/lib/apiClient';
import { NoImagePlaceholder } from '@/components/no-image-placeholder';

// Ensure any existing auth browser session is safely handled
WebBrowser.maybeCompleteAuthSession();

type PaymentType = 'Chapa' | 'Cash on Delivery';

const CHAPA_PROVIDERS = [
  { id: 'telebirr', label: 'telebirr', icon: 'phone-portrait-outline' },
  { id: 'cbe', label: 'CBE Birr', icon: 'wallet-outline' },
  { id: 'abyssinia', label: 'Abyssinia', icon: 'business-outline' },
  { id: 'cards', label: 'Cards', icon: 'card-outline' },
] as const;

export default function CheckoutScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    cartItems,
    cartCount,
    placeOrder,
    clearCart,
    refreshAll,
    isAuthenticated,
    currentUser,
  } = useStore();

  const [customerName, setCustomerName] = useState(currentUser?.name || '');
  const [customerPhone, setCustomerPhone] = useState(currentUser?.phone || '');
  const [customerEmail, setCustomerEmail] = useState(currentUser?.email || '');
  const [paymentMethod, setPaymentMethod] = useState<PaymentType>('Chapa');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [processingMessage, setProcessingMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser) {
      if (!customerName) setCustomerName(currentUser.name || '');
      if (!customerPhone) setCustomerPhone(currentUser.phone || '');
      if (!customerEmail) setCustomerEmail(currentUser.email || '');
    }
  }, [currentUser]);

  // Subtotal
  const totalAmount = cartItems.reduce(
    (acc, item) => acc + item.product.price * item.quantity,
    0
  );

  if (!isAuthenticated) {
    return (
      <View style={styles.root}>
        <SafeAreaView edges={['top']} style={styles.headerContainer}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => router.back()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Feather name="arrow-left" size={20} color={LogoColors.deepCharcoal} />
            </TouchableOpacity>
            <Text style={styles.logoText}>ASTU GARMENT</Text>
            <View style={{ width: 38 }} />
          </View>
        </SafeAreaView>

        <View style={styles.centeredView}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="lock-closed-outline" size={36} color={LogoColors.sharpRedOrange} />
          </View>
          <Text style={styles.emptyTitle}>Account Required</Text>
          <Text style={styles.emptySubtitle}>
            Please sign in or create an account to place your bespoke purchase order.
          </Text>
          <TouchableOpacity
            style={styles.primaryPillButton}
            onPress={() =>
              router.push({
                pathname: '/auth',
                params: { mode: 'signin', redirect: '/checkout' },
              })
            }
            activeOpacity={0.88}
          >
            <Text style={styles.primaryPillButtonText}>Sign In / Register</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (cartItems.length === 0) {
    return (
      <View style={styles.root}>
        <SafeAreaView edges={['top']} style={styles.headerContainer}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => router.back()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Feather name="arrow-left" size={20} color={LogoColors.deepCharcoal} />
            </TouchableOpacity>
            <Text style={styles.logoText}>ASTU GARMENT</Text>
            <View style={{ width: 38 }} />
          </View>
        </SafeAreaView>

        <View style={styles.centeredView}>
          <View style={styles.emptyIconCircle}>
            <Feather name="shopping-bag" size={36} color={LogoColors.sharpRedOrange} />
          </View>
          <Text style={styles.emptyTitle}>Atelier Bag is Empty</Text>
          <Text style={styles.emptySubtitle}>
            Add handcrafted pieces to your atelier bag before proceeding to checkout.
          </Text>
          <TouchableOpacity
            style={styles.primaryPillButton}
            onPress={() => router.push('/(tabs)/shop')}
            activeOpacity={0.88}
          >
            <Text style={styles.primaryPillButtonText}>Explore Collection</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const handlePlaceOrder = async () => {
    setError(null);

    const cName = customerName.trim() || currentUser?.name || 'Valued Customer';
    const cEmail = customerEmail.trim() || currentUser?.email || 'customer@astugarment.com';
    const cPhone = customerPhone.trim();

    if (!cPhone || cPhone.length < 8) {
      setError('Please provide a valid mobile number for order delivery and confirmation.');
      return;
    }

    const validation = validateData(
      CreateOrderSchema.pick({ customerName: true, customerEmail: true }),
      { customerName: cName, customerEmail: cEmail }
    );
    if (!validation.success) {
      setError(validation.error);
      return;
    }

    if (paymentMethod === 'Chapa') {
      const cleanPhone = normalizeEthiopianPhone(cPhone);
      if (!cleanPhone || !EthiopianPhoneRegex.test(cleanPhone)) {
        setError('Please enter a valid Ethiopian mobile number (e.g. 0912345678 or 0712345678) for telebirr / CBE payment.');
        return;
      }

      setIsSubmitting(true);
      setProcessingMessage('Connecting to Chapa Secure Gateway...');
      Haptics.selectionAsync().catch(() => {});

      try {
        const returnUrl = Linking.createURL('payment/callback');

        const initRes = await apiClient.initializeChapaPayment({
          customerName: cName,
          customerEmail: cEmail,
          customerPhone: cleanPhone,
          returnUrl,
          items: cartItems.map((ci) => ({
            productId: ci.product.id,
            id: ci.product.id,
            sku: (ci.product as any).sku || `SKU-${ci.product.id.slice(0, 8).toUpperCase()}`,
            name: ci.product.name,
            title: ci.product.name,
            quantity: ci.quantity,
            price: ci.product.price,
            priceEtb: ci.product.price,
            unitPrice: ci.product.price,
            unitPriceFormatted: ci.product.priceFormatted,
            size: ci.size || 'M',
            colorName: ci.colorName || 'Standard',
            image: ci.product.image || '',
            customMeasurements: ci.customMeasurements || null,
          })),
          totalPriceEtb: totalAmount,
          shippingAddress: 'Bole Medhanealem, Addis Ababa, Ethiopia',
          orderSource: 'app',
        });

        const rawInitData = initRes.data as any;
        const checkoutUrl = rawInitData?.checkoutUrl || rawInitData?.data?.checkoutUrl;
        const txRef = rawInitData?.txRef || rawInitData?.data?.txRef;
        const orderId = rawInitData?.orderId || rawInitData?.data?.orderId;

        if (!initRes.success || !checkoutUrl) {
          setError(initRes.error || 'Failed to initialize Chapa payment session. Please try again.');
          setIsSubmitting(false);
          setProcessingMessage(null);
          return;
        }

        setProcessingMessage('Awaiting payment completion in secure browser...');
        const authResult = await WebBrowser.openAuthSessionAsync(checkoutUrl, returnUrl);

        if (authResult.type === 'success') {
          setProcessingMessage('Authenticating transaction with Chapa...');

          let verifiedTxRef = txRef;
          let verifiedOrderId = orderId;

          if (authResult.url) {
            const parsed = Linking.parse(authResult.url);
            if (parsed.queryParams?.tx_ref) {
              verifiedTxRef = String(parsed.queryParams.tx_ref);
            }
            if (parsed.queryParams?.order_id) {
              verifiedOrderId = String(parsed.queryParams.order_id);
            }
          }

          const verifyRes = await apiClient.verifyChapaPayment({
            txRef: verifiedTxRef,
            orderId: verifiedOrderId,
          });

          if (verifyRes.success && verifyRes.data?.status === 'paid') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
            clearCart();
            refreshAll().catch(() => {});
            router.replace({ pathname: '/track-order', params: { id: verifiedOrderId } });
            return;
          } else {
            setError(
              verifyRes.error ||
                'Payment verification could not be confirmed. If your wallet was charged, rest assured our concierge team will reconcile it.'
            );
            setIsSubmitting(false);
            setProcessingMessage(null);
            return;
          }
        } else if (authResult.type === 'cancel' || authResult.type === 'dismiss') {
          setError('Payment session was cancelled. Your atelier bag has been preserved.');
          setIsSubmitting(false);
          setProcessingMessage(null);
          return;
        } else {
          setError('Payment window was closed before completion. You can retry at any time.');
          setIsSubmitting(false);
          setProcessingMessage(null);
          return;
        }
      } catch (err: any) {
        setError(err?.message || 'Error processing payment with Chapa.');
        setIsSubmitting(false);
        setProcessingMessage(null);
      }
    } else {
      // Cash on Delivery
      setIsSubmitting(true);
      setProcessingMessage('Reserving atelier pieces...');
      Haptics.selectionAsync().catch(() => {});
      try {
        const orderPayload = {
          customerName: cName,
          customerEmail: cEmail,
          customerPhone: cPhone,
          paymentMethod: 'Cash / Card on Delivery',
        };
        const orderId = await placeOrder(orderPayload);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        router.replace({ pathname: '/track-order', params: { id: orderId } });
      } catch (err: any) {
        setError(err?.message || 'Failed to place order. Please try again.');
        setIsSubmitting(false);
        setProcessingMessage(null);
      }
    }
  };

  return (
    <View style={styles.root}>
      {/* Top Header */}
      <SafeAreaView edges={['top']} style={styles.headerContainer}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.iconButton}
            activeOpacity={0.7}
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather name="arrow-left" size={20} color={LogoColors.deepCharcoal} />
          </TouchableOpacity>

          <Text style={styles.logoText}>ASTU GARMENT</Text>

          <TouchableOpacity
            style={styles.iconButton}
            activeOpacity={0.7}
            onPress={() => router.push('/cart')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather name="shopping-bag" size={18} color={LogoColors.deepCharcoal} />
            {cartCount > 0 && (
              <View style={styles.headerBadge}>
                <Text style={styles.headerBadgeText}>{cartCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView
        style={styles.flexOne}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 92 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.titleSection}>
            <Text style={styles.pageTitle}>Order Checkout</Text>
            <Text style={styles.pageSubtitle}>
              Review your delivery details and choose your preferred payment method.
            </Text>
          </View>

          {/* 1. Customer Account & Contact Details */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="person-circle-outline" size={21} color={LogoColors.sharpRedOrange} />
              <Text style={styles.sectionTitle}>Customer & Atelier Contact</Text>
            </View>

            <View style={styles.accountInfoWrap}>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Client Name</Text>
                <TextInput
                  style={styles.input}
                  value={customerName}
                  onChangeText={setCustomerName}
                  placeholder="Full Name"
                  placeholderTextColor="#9C8E80"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Mobile Number (for Delivery & Payment)</Text>
                <TextInput
                  style={styles.input}
                  value={customerPhone}
                  onChangeText={setCustomerPhone}
                  placeholder="+251 91 123 4567"
                  keyboardType="phone-pad"
                  placeholderTextColor="#9C8E80"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Email Address</Text>
                <TextInput
                  style={[styles.input, styles.inputDisabled]}
                  value={customerEmail}
                  editable={false}
                  placeholderTextColor="#9C8E80"
                />
              </View>

              <Text style={styles.accountNote}>
                ✨ This order will be linked directly to your atelier customer profile for express delivery.
              </Text>
            </View>
          </View>

          {/* 2. Payment Method Selector */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="card-outline" size={20} color={LogoColors.sharpRedOrange} />
              <Text style={styles.sectionTitle}>Payment Method</Text>
            </View>

            <View style={styles.paymentMethodsWrap}>
              {/* Option A: Chapa Instant & Verified Mobile Payment */}
              <TouchableOpacity
                style={[
                  styles.paymentOptionCard,
                  paymentMethod === 'Chapa' && styles.paymentOptionActive,
                ]}
                activeOpacity={0.88}
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  setPaymentMethod('Chapa');
                }}
              >
                <View style={styles.radioOuter}>
                  {paymentMethod === 'Chapa' && <View style={styles.radioInner} />}
                </View>
                <View style={styles.paymentOptionContent}>
                  <View style={styles.paymentTitleRow}>
                    <Text style={styles.paymentOptionTitle}>Mobile Transfer (Chapa)</Text>
                    <View style={styles.verifiedBadge}>
                      <Ionicons name="shield-checkmark" size={11} color="#15803D" />
                      <Text style={styles.verifiedBadgeText}>Instant & Verified</Text>
                    </View>
                  </View>
                  <Text style={styles.paymentOptionSubtitle}>
                    telebirr, CBE Birr, Awash, Abyssinia, Visa & Mastercard
                  </Text>

                  {/* Active provider chips */}
                  <View style={styles.decorativeChipsRow} pointerEvents="none">
                    {CHAPA_PROVIDERS.map((item) => (
                      <View key={item.id} style={styles.decorativeChip}>
                        <Ionicons
                          name={item.icon as any}
                          size={12}
                          color="#7A6C5F"
                          style={styles.decorativeChipIcon}
                        />
                        <Text style={styles.decorativeChipText}>{item.label}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </TouchableOpacity>

              {paymentMethod === 'Chapa' && (
                <View style={styles.chapaNoticeBox}>
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={16}
                    color="#15803D"
                  />
                  <Text style={styles.chapaNoticeText}>
                    Secured by Chapa Payment Gateway (National Bank of Ethiopia Licensed). Complete payment via your mobile wallet or bank app and return automatically to the atelier.
                  </Text>
                </View>
              )}

              {/* Option B: Cash on Delivery / Studio Payment */}
              <TouchableOpacity
                style={[
                  styles.paymentOptionCard,
                  paymentMethod === 'Cash on Delivery' && styles.paymentOptionActive,
                ]}
                activeOpacity={0.88}
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  setPaymentMethod('Cash on Delivery');
                }}
              >
                <View style={styles.radioOuter}>
                  {paymentMethod === 'Cash on Delivery' && <View style={styles.radioInner} />}
                </View>
                <View style={styles.paymentOptionContent}>
                  <View style={styles.paymentTitleRow}>
                    <Text style={styles.paymentOptionTitle}>Cash / Card on Delivery</Text>
                    <View style={styles.studioBadge}>
                      <Text style={styles.studioBadgeText}>Studio Handover</Text>
                    </View>
                  </View>
                  <Text style={styles.paymentOptionSubtitle}>
                    Pay upon white-glove delivery or collection at ASTU Garment Atelier
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* 3. Order Summary & Items */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <Feather name="shopping-bag" size={18} color={LogoColors.sharpRedOrange} />
              <Text style={styles.sectionTitle}>
                Order Pieces ({cartItems.length})
              </Text>
            </View>

            <View style={styles.orderItemsList}>
              {cartItems.map((item) => (
                <View key={item.id} style={styles.itemRow}>
                  {item.product.image ? (
                    <Image
                      source={{ uri: resolveImageUrl(item.product.image, 'thumb') }}
                      style={styles.itemThumb}
                      contentFit="cover"
                      transition={200}
                      cachePolicy="memory-disk"
                    />
                  ) : (
                    <NoImagePlaceholder variant="thumb" style={styles.itemThumb} />
                  )}
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName} numberOfLines={1}>
                      {item.product.name}
                    </Text>
                    <Text style={styles.itemVariant}>
                      {item.colorName ? `Color: ${item.colorName} • ` : ''}Size: {item.size || 'M'} • Qty: {item.quantity}
                    </Text>
                  </View>
                  <Text style={styles.itemPrice}>
                    ETB {(item.product.price * item.quantity).toLocaleString()}
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.summaryBreakdown}>
              <View style={styles.summaryLine}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>ETB {totalAmount.toLocaleString()}</Text>
              </View>

              <View style={styles.summaryLine}>
                <Text style={styles.summaryLabel}>White-Glove Delivery & Studio Fitting</Text>
                <Text style={styles.summaryFree}>Complimentary</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.totalLine}>
                <Text style={styles.totalLabel}>Total Payable</Text>
                <Text style={styles.totalValue}>ETB {totalAmount.toLocaleString()}</Text>
              </View>
            </View>
          </View>

          {/* Error Banner */}
          {error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color="#DC2626" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Progress / Status indicator during submission */}
          {isSubmitting && processingMessage && (
            <View style={styles.processingStatusCard}>
              <ActivityIndicator size="small" color={LogoColors.sharpRedOrange} />
              <Text style={styles.processingStatusText}>{processingMessage}</Text>
            </View>
          )}

          {/* Place Order Pill Button */}
          <TouchableOpacity
            style={[styles.placeOrderBtn, isSubmitting && styles.placeOrderBtnDisabled]}
            activeOpacity={0.88}
            onPress={handlePlaceOrder}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Text style={styles.placeOrderBtnText}>
                  {paymentMethod === 'Chapa'
                    ? `Confirm & Pay • ETB ${totalAmount.toLocaleString()}`
                    : `Confirm & Place Order • ETB ${totalAmount.toLocaleString()}`}
                </Text>
                <Feather name="arrow-right" size={18} color="#FFFFFF" />
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: LogoColors.white,
  },
  flexOne: {
    flex: 1,
  },
  headerContainer: {
    backgroundColor: LogoColors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#F0EAE1',
    zIndex: 10,
  },
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: LogoColors.cardBorder,
  },
  headerBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: LogoColors.sharpRedOrange,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  headerBadgeText: {
    fontFamily: Fonts.hanken.bold,
    fontSize: 9.5,
    color: '#FFFFFF',
  },
  logoText: {
    fontFamily: Fonts.garamond.bold,
    fontSize: 22,
    letterSpacing: 4,
    color: LogoColors.deepCharcoal,
    textAlign: 'center',
  },

  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  titleSection: {
    marginBottom: 16,
  },
  pageTitle: {
    fontFamily: Fonts.garamond.bold,
    fontSize: 24,
    color: LogoColors.deepCharcoal,
    marginBottom: 4,
  },
  pageSubtitle: {
    fontFamily: Fonts.hanken.regular,
    fontSize: 13,
    color: '#8A7B6D',
  },

  // Centered Auth Required View
  centeredView: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyIconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#FFF4E6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontFamily: Fonts.garamond.bold,
    fontSize: 22,
    color: LogoColors.deepCharcoal,
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontFamily: Fonts.hanken.regular,
    fontSize: 13,
    color: '#8A7B6D',
    textAlign: 'center',
    maxWidth: 280,
    marginBottom: 22,
    lineHeight: 18,
  },
  primaryPillButton: {
    backgroundColor: LogoColors.sharpRedOrange,
    paddingHorizontal: 28,
    paddingVertical: 13,
    borderRadius: BorderRadius.full,
    ...Platform.select({
      ios: {
        shadowColor: LogoColors.sharpRedOrange,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  primaryPillButtonText: {
    fontFamily: Fonts.hanken.bold,
    fontSize: 14,
    color: '#FFFFFF',
  },

  // Section Cards
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: LogoColors.cardBorder,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  sectionTitle: {
    fontFamily: Fonts.garamond.bold,
    fontSize: 17,
    color: LogoColors.deepCharcoal,
  },

  // Account Fields
  accountInfoWrap: {
    gap: 12,
  },
  fieldGroup: {
    gap: 4,
  },
  fieldLabel: {
    fontFamily: Fonts.hanken.medium,
    fontSize: 12,
    color: LogoColors.deepCharcoal,
  },
  input: {
    height: 46,
    backgroundColor: '#FAF7F2',
    borderRadius: 14,
    paddingHorizontal: 14,
    fontFamily: Fonts.hanken.regular,
    fontSize: 13.5,
    color: LogoColors.deepCharcoal,
    borderWidth: 1,
    borderColor: LogoColors.cardBorder,
  },
  inputDisabled: {
    backgroundColor: '#F3EFE9',
    color: '#8A7B6D',
  },
  accountNote: {
    fontFamily: Fonts.hanken.regular,
    fontSize: 11.5,
    color: LogoColors.sharpRedOrange,
    marginTop: 2,
    lineHeight: 16,
  },

  // Payment Options
  paymentMethodsWrap: {
    gap: 10,
  },
  paymentOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: LogoColors.cardBorder,
    backgroundColor: '#FAF7F2',
    gap: 12,
  },
  paymentOptionActive: {
    borderColor: LogoColors.sharpRedOrange,
    backgroundColor: '#FFF8F0',
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: LogoColors.sharpRedOrange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: LogoColors.sharpRedOrange,
  },
  paymentOptionContent: {
    flex: 1,
  },
  paymentOptionTitle: {
    fontFamily: Fonts.hanken.bold,
    fontSize: 14,
    color: LogoColors.deepCharcoal,
    marginBottom: 2,
  },
  paymentOptionSubtitle: {
    fontFamily: Fonts.hanken.regular,
    fontSize: 12,
    color: '#8A7B6D',
  },
  paymentTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: BorderRadius.full,
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  verifiedBadgeText: {
    fontFamily: Fonts.hanken.bold,
    fontSize: 10,
    color: '#15803D',
    letterSpacing: 0.3,
  },
  studioBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: BorderRadius.full,
    backgroundColor: '#F3EFE9',
    borderWidth: 1,
    borderColor: '#E7DFD5',
  },
  studioBadgeText: {
    fontFamily: Fonts.hanken.bold,
    fontSize: 10,
    color: '#6E5D4F',
    letterSpacing: 0.3,
  },
  processingStatusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFF8F0',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FEE0D2',
    marginBottom: 10,
  },
  processingStatusText: {
    fontFamily: Fonts.hanken.medium,
    fontSize: 12.5,
    color: LogoColors.sharpRedOrange,
  },
  decorativeChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  decorativeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    backgroundColor: '#EFEAE1',
    borderWidth: 1,
    borderColor: '#E2DBD0',
  },
  decorativeChipIcon: {
    marginRight: 4,
  },
  decorativeChipText: {
    fontFamily: Fonts.hanken.medium,
    fontSize: 11,
    color: '#63564A',
  },
  chapaNoticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 10,
    paddingHorizontal: 12,
    backgroundColor: '#FFF8F0',
    borderWidth: 1,
    borderColor: '#FEE0D2',
    borderRadius: 12,
    marginTop: -2,
    marginBottom: 4,
  },
  chapaNoticeText: {
    flex: 1,
    fontFamily: Fonts.hanken.regular,
    fontSize: 11.5,
    color: '#8A4A36',
    lineHeight: 16,
  },

  // Order Items
  orderItemsList: {
    gap: 10,
    marginBottom: 14,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  itemThumb: {
    width: 48,
    height: 56,
    borderRadius: 10,
    backgroundColor: '#FAF7F2',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontFamily: Fonts.garamond.bold,
    fontSize: 15,
    color: LogoColors.deepCharcoal,
  },
  itemVariant: {
    fontFamily: Fonts.hanken.regular,
    fontSize: 11.5,
    color: '#8A7B6D',
    marginTop: 2,
  },
  itemPrice: {
    fontFamily: Fonts.hanken.bold,
    fontSize: 13.5,
    color: LogoColors.deepCharcoal,
  },
  summaryBreakdown: {
    borderTopWidth: 1,
    borderTopColor: '#F0EAE1',
    paddingTop: 12,
  },
  summaryLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  summaryLabel: {
    fontFamily: Fonts.hanken.regular,
    fontSize: 13,
    color: '#8A7B6D',
  },
  summaryValue: {
    fontFamily: Fonts.hanken.bold,
    fontSize: 13,
    color: LogoColors.deepCharcoal,
  },
  summaryFree: {
    fontFamily: Fonts.hanken.bold,
    fontSize: 12,
    color: '#15803D',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0EAE1',
    marginVertical: 8,
  },
  totalLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  totalLabel: {
    fontFamily: Fonts.hanken.bold,
    fontSize: 15,
    color: LogoColors.deepCharcoal,
  },
  totalValue: {
    fontFamily: Fonts.garamond.bold,
    fontSize: 20,
    color: LogoColors.sharpRedOrange,
  },

  // Error Banner
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
  },
  errorText: {
    fontFamily: Fonts.hanken.medium,
    fontSize: 12.5,
    color: '#DC2626',
    flex: 1,
  },

  // CTA Button
  placeOrderBtn: {
    backgroundColor: LogoColors.sharpRedOrange,
    height: 52,
    borderRadius: BorderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: LogoColors.sharpRedOrange,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  placeOrderBtnDisabled: {
    opacity: 0.7,
  },
  placeOrderBtnText: {
    fontFamily: Fonts.hanken.bold,
    fontSize: 15,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
});
