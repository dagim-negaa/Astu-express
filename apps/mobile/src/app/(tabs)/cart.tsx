import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';

import { LogoColors, Fonts, Spacing, BorderRadius } from '@/constants/theme';
import { useStore, TAX_RATE } from '@/context/StoreContext';
import { resolveImageUrl } from '@astu/shared';
import { NoImagePlaceholder } from '@/components/no-image-placeholder';

export default function CartScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { cartItems, updateCartQuantity, removeFromCart, wishlistCount, isAuthenticated } = useStore();
  const [promoCode, setPromoCode] = useState('');

  const subtotal = cartItems.reduce(
    (acc, item) => acc + item.product.price * item.quantity,
    0
  );
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;

  return (
    <View style={styles.root}>
      {/* Top Header */}
      <SafeAreaView edges={['top']} style={styles.headerContainer}>
        <View style={styles.header}>
          <View style={styles.sideSlot} />

          {/* Perfectly Centralized ASTU GARMENT Brand Logo */}
          <View style={styles.centerSlot}>
            <Text style={styles.logoText}>ASTU GARMENT</Text>
          </View>

          {/* Wishlist Navigation Action */}
          <View style={styles.sideSlot}>
            <TouchableOpacity
              style={styles.iconButton}
              activeOpacity={0.7}
              onPress={() => router.push('/wishlist')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="heart-outline" size={20} color={LogoColors.deepCharcoal} />
              {wishlistCount > 0 && (
                <View style={styles.wishlistBadge}>
                  <Text style={styles.wishlistBadgeText}>{wishlistCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      {/* Main Scroll Content */}
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 110 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleSection}>
          <Text style={styles.pageTitle}>Shopping Bag</Text>
          <Text style={styles.itemCountText}>
            {cartItems.length} {cartItems.length === 1 ? 'handcrafted piece' : 'pieces'} in your bag
          </Text>
        </View>

        {cartItems.length === 0 ? (
          /* Empty State */
          <View style={styles.emptyState}>
            <View style={styles.emptyIconCircle}>
              <Feather name="shopping-bag" size={36} color={LogoColors.sharpRedOrange} />
            </View>
            <Text style={styles.emptyTitle}>Your bag is empty</Text>
            <Text style={styles.emptySubtitle}>
              Curated runway pieces and bespoke garments are waiting for you.
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              activeOpacity={0.88}
              onPress={() => router.push('/shop')}
            >
              <Text style={styles.emptyButtonText}>Explore Collections</Text>
              <Feather name="arrow-right" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Cart Items List */}
            <View style={styles.itemsListContainer}>
              {cartItems.map((item) => (
                <View key={item.id} style={styles.cartItemCard}>
                  {item.product.image ? (
                    <Image
                      source={{ uri: resolveImageUrl(item.product.image, 'thumb') }}
                      style={styles.itemThumbnail}
                      contentFit="cover"
                      transition={200}
                      cachePolicy="memory-disk"
                    />
                  ) : (
                    <NoImagePlaceholder variant="thumb" style={styles.itemThumbnail} />
                  )}

                  <View style={styles.itemDetailsCol}>
                    <View style={styles.itemHeaderRow}>
                      <View style={styles.itemTitles}>
                        <Text style={styles.itemName} numberOfLines={1}>
                          {item.product.name}
                        </Text>
                        <View style={styles.metaBadgeRow}>
                          {item.size && (
                            <View style={styles.specBadge}>
                              <Text style={styles.specBadgeText}>Size: {item.size}</Text>
                            </View>
                          )}
                          {item.colorName && (
                            <View style={styles.specBadge}>
                              <Text style={styles.specBadgeText}>{item.colorName}</Text>
                            </View>
                          )}
                        </View>
                      </View>

                      <TouchableOpacity
                        style={styles.removeButton}
                        activeOpacity={0.7}
                        onPress={() => removeFromCart(item.id)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons name="close" size={18} color="#9C8E80" />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.itemFooterRow}>
                      {/* Quantity Stepper Pill */}
                      <View style={styles.qtyStepper}>
                        <TouchableOpacity
                          style={styles.qtyButton}
                          activeOpacity={0.7}
                          onPress={() => updateCartQuantity(item.id, -1)}
                          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                        >
                          <Ionicons
                            name={item.quantity === 1 ? 'trash-outline' : 'remove'}
                            size={14}
                            color={LogoColors.deepCharcoal}
                          />
                        </TouchableOpacity>
                        <Text style={styles.qtyValue}>{item.quantity}</Text>
                        <TouchableOpacity
                          style={styles.qtyButton}
                          activeOpacity={0.7}
                          onPress={() => updateCartQuantity(item.id, 1)}
                          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                        >
                          <Ionicons name="add" size={14} color={LogoColors.deepCharcoal} />
                        </TouchableOpacity>
                      </View>

                      <Text style={styles.itemPrice}>
                        ETB {(item.product.price * item.quantity).toLocaleString()}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>

            {/* Promo Code Input */}
            <View style={styles.promoSection}>
              <TextInput
                placeholder="Enter Promo Code"
                placeholderTextColor="#9C8E80"
                value={promoCode}
                onChangeText={setPromoCode}
                autoCapitalize="characters"
                style={styles.promoInput}
              />
              <TouchableOpacity style={styles.applyButton} activeOpacity={0.85}>
                <Text style={styles.applyButtonText}>Apply</Text>
              </TouchableOpacity>
            </View>

            {/* Order Breakdown Summary Card */}
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Order Summary</Text>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>ETB {subtotal.toLocaleString()}</Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Delivery</Text>
                <Text style={styles.summaryValueFree}>Complimentary</Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Estimated Tax</Text>
                <Text style={styles.summaryValue}>ETB {Math.round(tax).toLocaleString()}</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>ETB {Math.round(total).toLocaleString()}</Text>
              </View>
            </View>

            {/* Prominent Checkout Button */}
            <TouchableOpacity
              style={styles.inlineCheckoutButton}
              activeOpacity={0.88}
              onPress={() => {
                if (!isAuthenticated) {
                  router.push({
                    pathname: '/auth',
                    params: { mode: 'signin', redirect: '/checkout' },
                  });
                  return;
                }
                router.push('/checkout');
              }}
            >
              <Feather name="shopping-bag" size={18} color="#FFFFFF" />
              <Text style={styles.inlineCheckoutButtonText}>
                Proceed to Checkout • ETB {Math.round(total).toLocaleString()}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: LogoColors.white,
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
  sideSlot: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontFamily: Fonts.garamond.bold,
    fontSize: 22,
    color: LogoColors.deepCharcoal,
    letterSpacing: 4,
    textAlign: 'center',
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: LogoColors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  wishlistBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: LogoColors.sharpRedOrange,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  wishlistBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontFamily: Fonts.hanken.bold,
  },

  // Main Scroll
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  titleSection: {
    marginBottom: 16,
  },
  pageTitle: {
    fontFamily: Fonts.garamond.bold,
    fontSize: 26,
    color: LogoColors.deepCharcoal,
  },
  itemCountText: {
    fontFamily: Fonts.hanken.regular,
    fontSize: 13,
    color: '#8A7B6D',
    marginTop: 2,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: LogoColors.cardBorder,
    paddingHorizontal: 24,
    marginTop: 10,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
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
  },
  emptySubtitle: {
    fontFamily: Fonts.hanken.regular,
    fontSize: 13,
    color: '#8A7B6D',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: LogoColors.sharpRedOrange,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: BorderRadius.full,
    gap: 8,
  },
  emptyButtonText: {
    fontFamily: Fonts.hanken.bold,
    fontSize: 13.5,
    color: '#FFFFFF',
  },

  // Items List
  itemsListContainer: {
    gap: 12,
    marginBottom: 18,
  },
  cartItemCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: LogoColors.cardBorder,
    padding: 10,
    gap: 12,
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
  itemThumbnail: {
    width: 82,
    height: 102,
    borderRadius: 12,
    backgroundColor: '#FAF7F2',
  },
  itemDetailsCol: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  itemHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemTitles: {
    flex: 1,
    paddingRight: 8,
  },
  itemName: {
    fontFamily: Fonts.garamond.bold,
    fontSize: 16,
    color: LogoColors.deepCharcoal,
    marginBottom: 4,
  },
  metaBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  specBadge: {
    backgroundColor: '#FFF4E6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  specBadgeText: {
    fontFamily: Fonts.hanken.medium,
    fontSize: 11,
    color: LogoColors.sharpRedOrange,
  },
  removeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FAF7F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  qtyStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF7F2',
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: LogoColors.cardBorder,
    paddingHorizontal: 4,
    height: 32,
  },
  qtyButton: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyValue: {
    fontFamily: Fonts.hanken.bold,
    fontSize: 13,
    color: LogoColors.deepCharcoal,
    minWidth: 20,
    textAlign: 'center',
  },
  itemPrice: {
    fontFamily: Fonts.hanken.bold,
    fontSize: 15,
    color: LogoColors.deepCharcoal,
  },

  // Promo Section
  promoSection: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  promoInput: {
    flex: 1,
    height: 46,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: LogoColors.cardBorder,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 16,
    fontFamily: Fonts.hanken.regular,
    fontSize: 13,
    color: LogoColors.deepCharcoal,
  },
  applyButton: {
    backgroundColor: LogoColors.deepCharcoal,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyButtonText: {
    fontFamily: Fonts.hanken.bold,
    fontSize: 13,
    color: '#FFFFFF',
  },

  // Summary Card
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: LogoColors.cardBorder,
    padding: 16,
    marginBottom: 16,
  },
  summaryTitle: {
    fontFamily: Fonts.garamond.bold,
    fontSize: 18,
    color: LogoColors.deepCharcoal,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontFamily: Fonts.hanken.regular,
    fontSize: 13,
    color: '#786A5C',
  },
  summaryValue: {
    fontFamily: Fonts.hanken.medium,
    fontSize: 13.5,
    color: LogoColors.deepCharcoal,
  },
  summaryValueFree: {
    fontFamily: Fonts.hanken.bold,
    fontSize: 13,
    color: '#16A34A',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0EAE1',
    marginVertical: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontFamily: Fonts.garamond.bold,
    fontSize: 18,
    color: LogoColors.deepCharcoal,
  },
  totalValue: {
    fontFamily: Fonts.hanken.bold,
    fontSize: 18,
    color: LogoColors.sharpRedOrange,
  },

  // Checkout Button
  inlineCheckoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: LogoColors.sharpRedOrange,
    height: 52,
    borderRadius: BorderRadius.full,
    gap: 8,
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
  inlineCheckoutButtonText: {
    fontFamily: Fonts.hanken.bold,
    fontSize: 14.5,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
});
