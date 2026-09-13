import React, { useCallback, useMemo } from 'react';
import {
  ScrollView,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';

import { LogoColors, Fonts, Spacing, BorderRadius } from '@/constants/theme';
import { useStore } from '@/context/StoreContext';
import { resolveImageUrl } from '@astu/shared';
import { NoImagePlaceholder } from '@/components/no-image-placeholder';

export default function WishlistScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    wishlistItems,
    toggleWishlist,
    removeFromWishlist,
    moveToCart,
    addToCart,
    cartCount,
    products,
  } = useStore();

  const handleRemove = useCallback(
    (id: string, productId?: string) => {
      removeFromWishlist(id);
      if (productId && productId !== id) {
        removeFromWishlist(productId);
      }
    },
    [removeFromWishlist]
  );

  const handleMoveToBag = useCallback(
    async (item: any) => {
      const targetId = item.id || item.productId;
      if (!targetId) return;
      await moveToCart(targetId);
    },
    [moveToCart]
  );

  const handleOpenProduct = (productId?: string) => {
    if (!productId) return;
    router.push({
      pathname: '/product-details',
      params: { id: productId },
    });
  };

  return (
    <View style={styles.root}>
      {/* Top Header */}
      <SafeAreaView edges={['top']} style={styles.headerContainer}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.iconButton}
            activeOpacity={0.7}
            onPress={() => (router.canGoBack() ? router.back() : router.push('/(tabs)'))}
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
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Main Wishlist Content */}
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 92 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleSection}>
          <Text style={styles.pageTitle}>My Wishlist</Text>
          <Text style={styles.pageSubtitle}>
            {wishlistItems.length} curated {wishlistItems.length === 1 ? 'piece' : 'pieces'} saved in your atelier portfolio
          </Text>
        </View>

        {wishlistItems.length === 0 ? (
          /* Empty State */
          <View style={styles.emptyState}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="heart-outline" size={38} color={LogoColors.sharpRedOrange} />
            </View>
            <Text style={styles.emptyTitle}>Your Wishlist is Empty</Text>
            <Text style={styles.emptySubtitle}>
              Explore our bespoke runway collections and save your favorite handcrafted garments here.
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              activeOpacity={0.88}
              onPress={() => router.push('/shop')}
            >
              <Text style={styles.emptyButtonText}>Explore Collections</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* Wishlist Items List */
          <View style={styles.itemsList}>
            {wishlistItems.map((item) => {
              const liveProduct = products.find((p) => p.id === item.productId);
              const displayName = liveProduct?.name || item.name;
              const displayImage = resolveImageUrl(liveProduct?.image || item.image, 'thumb');
              const displayCategory = (liveProduct?.category || 'Atelier').toUpperCase();
              const priceEtb = liveProduct?.price ?? 0;

              return (
                <View key={item.id} style={styles.wishlistCard}>
                  <TouchableOpacity
                    activeOpacity={0.88}
                    onPress={() => handleOpenProduct(item.productId)}
                  >
                    {displayImage ? (
                      <Image
                        source={{ uri: displayImage }}
                        style={styles.itemImage}
                        contentFit="cover"
                        transition={200}
                        cachePolicy="memory-disk"
                      />
                    ) : (
                      <NoImagePlaceholder variant="thumb" style={styles.itemImage} />
                    )}
                  </TouchableOpacity>

                  <View style={styles.itemDetails}>
                    <View style={styles.itemHeaderRow}>
                      <Text style={styles.itemCategory}>{displayCategory}</Text>
                      <TouchableOpacity
                        onPress={() => handleRemove(item.id, item.productId)}
                        style={styles.removeButton}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Ionicons name="close" size={18} color="#9C8E80" />
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                      activeOpacity={0.88}
                      onPress={() => handleOpenProduct(item.productId)}
                    >
                      <Text style={styles.itemTitle} numberOfLines={1}>
                        {displayName}
                      </Text>
                    </TouchableOpacity>

                    {item.variant ? (
                      <Text style={styles.itemVariant} numberOfLines={1}>
                        {item.variant}
                      </Text>
                    ) : null}

                    <View style={styles.itemFooterRow}>
                      <Text style={styles.itemPrice}>
                        {priceEtb > 0
                          ? `ETB ${priceEtb.toLocaleString()}`
                          : item.price || 'ETB —'}
                      </Text>

                      <TouchableOpacity
                        style={styles.moveToBagButton}
                        activeOpacity={0.85}
                        onPress={() => handleMoveToBag(item)}
                      >
                        <Feather name="shopping-bag" size={13} color="#FFFFFF" />
                        <Text style={styles.moveToBagText}>Move to Bag</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
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
  logoText: {
    fontFamily: Fonts.garamond.bold,
    fontSize: 22,
    letterSpacing: 4,
    color: LogoColors.deepCharcoal,
    textAlign: 'center',
  },
  cartBadge: {
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
  cartBadgeText: {
    fontFamily: Fonts.hanken.bold,
    fontSize: 9.5,
    color: '#FFFFFF',
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

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: LogoColors.cardBorder,
    paddingHorizontal: 24,
    marginTop: 8,
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
  },
  emptySubtitle: {
    fontFamily: Fonts.hanken.regular,
    fontSize: 13,
    color: '#8A7B6D',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
    maxWidth: 280,
  },
  emptyButton: {
    backgroundColor: LogoColors.sharpRedOrange,
    paddingVertical: 12,
    paddingHorizontal: 26,
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
  emptyButtonText: {
    fontFamily: Fonts.hanken.bold,
    fontSize: 13.5,
    color: '#FFFFFF',
  },

  // Wishlist Items
  itemsList: {
    gap: 14,
  },
  wishlistCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: LogoColors.cardBorder,
    flexDirection: 'row',
    padding: 12,
    gap: 14,
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
  itemImage: {
    width: 90,
    height: 104,
    borderRadius: 14,
    backgroundColor: '#FAF7F2',
  },
  itemDetails: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  itemHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemCategory: {
    fontFamily: Fonts.hanken.bold,
    fontSize: 10,
    color: LogoColors.goldenOrange,
    letterSpacing: 0.5,
  },
  removeButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FAF7F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTitle: {
    fontFamily: Fonts.garamond.bold,
    fontSize: 16,
    color: LogoColors.deepCharcoal,
    marginTop: 2,
  },
  itemVariant: {
    fontFamily: Fonts.hanken.regular,
    fontSize: 11.5,
    color: '#8A7B6D',
  },
  itemFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  itemPrice: {
    fontFamily: Fonts.hanken.bold,
    fontSize: 14,
    color: LogoColors.deepCharcoal,
  },
  moveToBagButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: LogoColors.sharpRedOrange,
    paddingVertical: 7,
    paddingHorizontal: 13,
    borderRadius: BorderRadius.full,
    gap: 5,
  },
  moveToBagText: {
    fontFamily: Fonts.hanken.bold,
    fontSize: 11.5,
    color: '#FFFFFF',
  },
});
