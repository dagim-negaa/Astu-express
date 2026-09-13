import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
  RefreshControl,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Ionicons,
  Feather,
  MaterialIcons,
} from '@expo/vector-icons';

import * as Haptics from 'expo-haptics';

import { LogoColors, Fonts, Spacing, BorderRadius } from '@/constants/theme';
import { useStore } from '@/context/StoreContext';
import { getGarmentTypeLabel, matchesCategoryFilter, resolveImageUrl } from '@astu/shared';
import { NoImagePlaceholder } from '@/components/no-image-placeholder';
import { prefetchProductImages } from '@/lib/imagePrefetch';

const HABESHA_KEMIS_HERO = require('@/assets/images/habesha-kemis-hero.jpg');

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HORIZONTAL_PADDING = 16;
const CARD_GAP = 12;
const PRODUCT_CARD_WIDTH = Math.floor(
  (SCREEN_WIDTH - HORIZONTAL_PADDING * 2 - CARD_GAP) / 2
);

const CATEGORIES = [
  { id: 'all', name: 'All' },
  { id: 'rtw', name: 'Ready-to-Wear' },
  { id: 'traditional', name: 'Habesha Kemis' },
  { id: 'outerwear', name: 'Jackets & Coats' },
  { id: 'accessories', name: 'Accessories' },
  { id: 'footwear', name: 'Footwear' },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    products,
    cartItems,
    addToCart,
    updateCartQuantity,
    toggleWishlist,
    isWishlisted,
    fetchCatalog,
    isLoading,
  } = useStore();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);

  // Re-fetch catalog on screen mount to guarantee synchronization with Cloudflare D1
  useEffect(() => {
    fetchCatalog().catch(() => {});
  }, [fetchCatalog]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    try {
      await fetchCatalog();
    } finally {
      setRefreshing(false);
    }
  }, [fetchCatalog]);

  // Curated spotlight pieces from dashboard (with fallback to catalog if none marked)
  const spotlightProducts = useMemo(() => {
    const featured = products.filter((p) => Boolean(p.is_featured || (p as any).isFeatured));
    return featured.length > 0 ? featured : products;
  }, [products]);

  // Lead banner image: first spotlight item or default luxury editorial fashion cutout
  const leadHeroImage = resolveImageUrl(
    spotlightProducts[0]?.image,
    'preview'
  );

  // Products displayed on Home Page: Spotlighted products from dashboard, filtered by selected category
  const displayedProducts = useMemo(() => {
    if (selectedCategory === 'all') return spotlightProducts;
    return spotlightProducts.filter((p) => matchesCategoryFilter(p.category, selectedCategory));
  }, [spotlightProducts, selectedCategory]);

  // Background prefetch upcoming runway items beyond visible viewport
  useEffect(() => {
    if (displayedProducts.length > 0) {
      prefetchProductImages(displayedProducts.slice(4, 12), 'preview');
    }
  }, [displayedProducts]);

  return (
    <View style={styles.root}>
      {/* ==================================================
          1. HEADER
          - ONLY the ASTU GARMENT title, dead-center at top.
          - NO search icon button at the top (avoids duplicate).
          - NO hamburger menu.
         ================================================== */}
      <View style={[styles.headerWrapper, { paddingTop: Math.max(insets.top, 12) + 6 }]}>
        <View style={styles.headerBar}>
          <Text style={styles.brandTitle}>ASTU GARMENT</Text>
        </View>
      </View>

      {/* Main Scrollable Runway Content */}
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 92 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={LogoColors.sharpRedOrange}
            colors={[LogoColors.sharpRedOrange]}
          />
        }
      >
        {/* ==================================================
            2. SEARCH BAR SECTION
            - Clean white rounded pill directly below header
            - NO location indicator above it
            - NO filter trigger buttons inside
            - Tapping navigates to /search
           ================================================== */}
        <View style={styles.searchSection}>
          <TouchableOpacity
            style={styles.searchBar}
            activeOpacity={0.88}
            onPress={() => router.push('/search')}
          >
            <Ionicons name="search" size={18} color="#9C8E80" style={styles.searchIcon} />
            <Text style={styles.searchPlaceholder} numberOfLines={1}>
              Search luxury pieces, shemiz, kemis...
            </Text>
          </TouchableOpacity>
        </View>

        {/* ==================================================
            3. PROMOTIONAL BANNER CARD
            - Large rounded card with brand light blue gradient
            - (#0ea5e9 -> #0284c7)
            - Headline, subtext, white pill CTA button, model image
           ================================================== */}
        <View style={styles.bannerSection}>
          <View style={styles.bannerCard}>
            <LinearGradient
              colors={['#0ea5e9', '#0284c7']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />

            {/* Left Content Column */}
            <View style={styles.bannerLeftCol}>
              <View style={styles.bannerPillTag}>
                <Text style={styles.bannerPillText}>ASTU ATELIER</Text>
              </View>

              <Text style={styles.bannerHeadline}>
                Modern Atelier &{'\n'}Tailored Apparel
              </Text>

              <Text style={styles.bannerSubtext} numberOfLines={2}>
                Premium textiles, bespoke fits & campus contemporary style.
              </Text>

              <TouchableOpacity
                style={styles.bannerCtaButton}
                activeOpacity={0.85}
                onPress={() => router.push('/shop')}
              >
                <Text style={styles.bannerCtaText}>Explore Collection</Text>
                <Feather name="arrow-right" size={13} color={LogoColors.sharpRedOrange} />
              </TouchableOpacity>
            </View>

            {/* Right Promotional Image Column - Constant Ethiopian Habesha Kemis Model */}
            <View style={styles.bannerRightCol}>
              <Image
                source={HABESHA_KEMIS_HERO}
                style={styles.bannerImage}
                contentFit="cover"
                contentPosition="top center"
                transition={250}
                priority="high"
              />
              <LinearGradient
                colors={['rgba(2, 132, 199, 0.35)', 'rgba(2, 132, 199, 0.05)', 'transparent']}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 0.35, y: 0.5 }}
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
              />
            </View>
          </View>
        </View>

        {/* ==================================================
            4. CATEGORY PILL SCROLL
            - Clean horizontal text pills
            - Pulled from actual catalog categories
            - Active pill highlighted in sharp brand color
           ================================================== */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Categories</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push('/shop')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryPillsScroll}
          >
            {CATEGORIES.map((cat, idx) => {
              const isSelected = selectedCategory === cat.id;
              // Alternating active color between sharp reddish-orange and golden orange
              const activeColor =
                idx % 2 === 0 ? LogoColors.sharpRedOrange : LogoColors.goldenOrange;

              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryPill,
                    isSelected
                      ? [styles.categoryPillActive, { backgroundColor: activeColor }]
                      : styles.categoryPillInactive,
                  ]}
                  activeOpacity={0.8}
                  onPress={() => setSelectedCategory(cat.id)}
                >
                  <Text
                    style={[
                      styles.categoryPillText,
                      isSelected
                        ? styles.categoryPillTextActive
                        : styles.categoryPillTextInactive,
                    ]}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ==================================================
            5 & 6. 2-COLUMN PRODUCT GRID & CARDS
            - Large product image with favorite heart on top-right
            - Alternating badges on top-left (sharp red-orange & golden-orange)
            - Line 1: Product Name (e.g. Tekur Shemiz)
            - Line 2: Garment Type (e.g. Shirt, Traditional Dress, T-Shirt)
            - Line 3: Bold ETB Price + Circular black Add-to-Cart "+" Button
           ================================================== */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.titleIconRow}>
              <Text style={styles.sectionTitle}>Curated Runway</Text>
              <MaterialIcons name="auto-awesome" size={16} color={LogoColors.goldenOrange} />
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push('/shop')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {displayedProducts.length > 0 ? (
            <View style={styles.productsGrid}>
              {displayedProducts.map((product, index) => {
                const wishlisted = isWishlisted(product.id);
                const isOutOfStock = (product.stockQuantity ?? (product as any).stock ?? 1) === 0;

                // Alternating badge color sampled from logo:
                // Even items get sharp reddish-orange (#EB5424), odd items get golden-orange (#FA9D1B)
                const isEven = index % 2 === 0;
                const badgeBgColor = isEven ? LogoColors.sharpRedOrange : LogoColors.goldenOrange;
                const badgeLabel = product.tag || (isEven ? 'Spotlight' : 'Exclusive');
                const garmentType = getGarmentTypeLabel(product);
                const cartItem = cartItems.find((ci) => ci.product.id === product.id);
                const quantityInCart = cartItem?.quantity || 0;

                return (
                  <TouchableOpacity
                    key={product.id}
                    style={styles.productCard}
                    activeOpacity={0.92}
                    onPress={() =>
                      router.push({
                        pathname: '/product-details',
                        params: { id: product.id },
                      })
                    }
                  >
                    {/* Large Image Area or No Image Placeholder */}
                    <View style={styles.productImageContainer}>
                      {product.image ? (
                        <Image
                          source={{ uri: resolveImageUrl(product.image, 'preview') }}
                          style={styles.productImage}
                          contentFit="cover"
                          transition={250}
                          cachePolicy="memory-disk"
                          priority={index < 4 ? 'high' : 'normal'}
                        />
                      ) : (
                        <NoImagePlaceholder
                          variant="card"
                          title={product.name || product.title}
                          style={styles.productImage}
                        />
                      )}

                      {/* Top-Left Alternating Badge */}
                      <View style={[styles.productBadge, { backgroundColor: badgeBgColor }]}>
                        <Text style={styles.productBadgeText}>{badgeLabel}</Text>
                      </View>

                      {/* Top-Right Favorite Heart Button */}
                      <TouchableOpacity
                        style={styles.favoriteButton}
                        activeOpacity={0.8}
                        onPress={(e) => {
                          e.stopPropagation();
                          toggleWishlist(product.id);
                        }}
                        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                      >
                        <Ionicons
                          name={wishlisted ? 'heart' : 'heart-outline'}
                          size={16}
                          color={wishlisted ? LogoColors.sharpRedOrange : LogoColors.deepCharcoal}
                        />
                      </TouchableOpacity>
                    </View>

                    {/* Product Information */}
                    <View style={styles.productMetaArea}>
                      {/* Line 1: Product Name */}
                      <Text style={styles.productTitle} numberOfLines={1}>
                        {product.name || product.title}
                      </Text>

                      {/* Line 2: What it actually is (Garment Type) */}
                      <Text style={styles.productTypeSubtext} numberOfLines={1}>
                        {garmentType}
                      </Text>

                      {/* Line 3: Price & Add-to-Cart Row */}
                      <View style={styles.productPriceRow}>
                        <Text style={styles.priceText}>
                          {product.priceFormatted ||
                            `ETB ${(product.priceEtb ?? product.price ?? 0).toLocaleString()}`}
                        </Text>

                        {/* Inline Stepper if in Cart, or Compact Circular Add Button */}
                        {quantityInCart > 0 ? (
                          <View style={styles.inlineCardStepper}>
                            <TouchableOpacity
                              style={styles.cardStepperBtn}
                              activeOpacity={0.7}
                              onPress={(e) => {
                                e.stopPropagation();
                                Haptics.selectionAsync().catch(() => {});
                                if (cartItem) {
                                  updateCartQuantity(cartItem.id, -1);
                                }
                              }}
                              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                            >
                              <Ionicons
                                name={quantityInCart === 1 ? 'trash-outline' : 'remove'}
                                size={12}
                                color={LogoColors.deepCharcoal}
                              />
                            </TouchableOpacity>

                            <Text style={styles.cardStepperQty}>{quantityInCart}</Text>

                            <TouchableOpacity
                              style={styles.cardStepperBtn}
                              activeOpacity={0.7}
                              onPress={(e) => {
                                e.stopPropagation();
                                Haptics.selectionAsync().catch(() => {});
                                if (cartItem) {
                                  updateCartQuantity(cartItem.id, 1);
                                } else {
                                  addToCart(product.id);
                                }
                              }}
                              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                            >
                              <Ionicons name="add" size={13} color={LogoColors.deepCharcoal} />
                            </TouchableOpacity>
                          </View>
                        ) : (
                          <TouchableOpacity
                            style={[
                              styles.addButton,
                              isOutOfStock && styles.addButtonDisabled,
                            ]}
                            activeOpacity={0.85}
                            disabled={isOutOfStock}
                            onPress={(e) => {
                              e.stopPropagation();
                              Haptics.selectionAsync().catch(() => {});
                              addToCart(product.id);
                            }}
                            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                          >
                            <Ionicons name="add" size={19} color="#FFFFFF" />
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <Ionicons name="shirt-outline" size={36} color="#C4B4A2" style={{ marginBottom: 8 }} />
              <Text style={styles.emptyTitle}>
                {isLoading ? 'Syncing Runway Collection...' : 'No Pieces in this Category'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {isLoading
                  ? 'Connecting to the Cloudflare atelier edge catalog...'
                  : 'Try selecting "All" or pull down to refresh the latest pieces from the atelier.'}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: LogoColors.white,
  },

  // 1. Header: ASTU GARMENT dead-center only
  headerWrapper: {
    backgroundColor: LogoColors.white,
    zIndex: 10,
  },
  headerBar: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: HORIZONTAL_PADDING,
  },
  brandTitle: {
    fontFamily: Fonts.garamond.bold,
    fontSize: 24,
    fontWeight: '800',
    color: LogoColors.deepCharcoal,
    letterSpacing: 4,
    textAlign: 'center',
  },

  // Scroll Container
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 8,
  },

  // 2. Search Section: Directly under header, no location
  searchSection: {
    paddingHorizontal: HORIZONTAL_PADDING,
    marginBottom: Spacing.four,
  },
  searchBar: {
    height: 46,
    borderRadius: BorderRadius.full,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: LogoColors.cardBorder,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  searchIcon: {
    marginRight: 10,
  },
  searchPlaceholder: {
    flex: 1,
    fontFamily: Fonts.hanken.regular,
    fontSize: 13,
    color: '#9C8E80',
  },

  // 3. Promotional Banner Card: Logo gradient (Grand Luxury Scale)
  bannerSection: {
    paddingHorizontal: HORIZONTAL_PADDING,
    marginBottom: Spacing.five,
  },
  bannerCard: {
    height: 260,
    borderRadius: 26,
    overflow: 'hidden',
    flexDirection: 'row',
    ...Platform.select({
      ios: {
        shadowColor: LogoColors.sharpRedOrange,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.22,
        shadowRadius: 16,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  bannerLeftCol: {
    flex: 1.15,
    padding: 22,
    justifyContent: 'space-between',
    zIndex: 2,
  },
  bannerPillTag: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(30, 30, 30, 0.82)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  bannerPillText: {
    fontFamily: Fonts.hanken.bold,
    fontSize: 10,
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },
  bannerHeadline: {
    fontFamily: Fonts.garamond.bold,
    fontSize: 25,
    lineHeight: 30,
    color: '#FFFFFF',
    marginTop: 6,
  },
  bannerSubtext: {
    fontFamily: Fonts.hanken.regular,
    fontSize: 13,
    color: '#FFF4E6',
    lineHeight: 18,
    marginTop: 2,
  },
  bannerCtaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: BorderRadius.full,
    gap: 6,
    marginTop: 6,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.14,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  bannerCtaText: {
    fontFamily: Fonts.hanken.bold,
    fontSize: 13,
    color: LogoColors.sharpRedOrange,
    letterSpacing: 0.2,
  },
  bannerRightCol: {
    flex: 0.95,
    height: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },

  // Common Section Layout
  sectionContainer: {
    paddingHorizontal: HORIZONTAL_PADDING,
    marginBottom: Spacing.five,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontFamily: Fonts.garamond.bold,
    fontSize: 20,
    color: LogoColors.deepCharcoal,
    letterSpacing: 0.1,
  },
  seeAllText: {
    fontFamily: Fonts.hanken.semiBold,
    fontSize: 13,
    color: LogoColors.sharpRedOrange,
  },

  // 4. Category Pills
  categoryPillsScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: HORIZONTAL_PADDING,
    paddingVertical: 2,
  },
  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryPillActive: {
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  categoryPillInactive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: LogoColors.cardBorder,
  },
  categoryPillText: {
    fontFamily: Fonts.hanken.medium,
    fontSize: 12.5,
  },
  categoryPillTextActive: {
    color: '#FFFFFF',
    fontFamily: Fonts.hanken.bold,
  },
  categoryPillTextInactive: {
    color: '#635445',
  },

  // 5 & 6. 2-Column Product Grid & Cards
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: CARD_GAP,
  },
  productCard: {
    width: PRODUCT_CARD_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: LogoColors.cardBorder,
    overflow: 'hidden',
    padding: 7,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  productImageContainer: {
    width: '100%',
    aspectRatio: 1, // Exact 1:1 square ratio
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#FAF7F2',
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productBadge: {
    position: 'absolute',
    top: 7,
    left: 7,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  productBadgeText: {
    fontFamily: Fonts.hanken.bold,
    fontSize: 9.5,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  favoriteButton: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  productMetaArea: {
    paddingTop: 8,
    paddingHorizontal: 4,
    paddingBottom: 2,
  },
  productTitle: {
    fontFamily: Fonts.garamond.bold,
    fontSize: 14.5,
    color: LogoColors.deepCharcoal,
    marginBottom: 2,
  },
  productTypeSubtext: {
    fontFamily: Fonts.hanken.regular,
    fontSize: 11.5,
    color: '#8A7B6D',
    marginBottom: 6,
  },
  productPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceText: {
    fontFamily: Fonts.hanken.bold,
    fontSize: 14.5,
    color: LogoColors.deepCharcoal,
  },
  addButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: LogoColors.deepCharcoal,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  addButtonDisabled: {
    backgroundColor: '#D1C7BD',
  },
  inlineCardStepper: {
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FAF7F2',
    borderWidth: 1,
    borderColor: LogoColors.cardBorder,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 3,
    gap: 1,
  },
  cardStepperBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardStepperQty: {
    fontFamily: Fonts.hanken.bold,
    fontSize: 12,
    color: LogoColors.deepCharcoal,
    minWidth: 16,
    textAlign: 'center',
  },

  // Empty State Card
  emptyCard: {
    padding: Spacing.five,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: LogoColors.cardBorder,
    marginTop: 4,
  },
  emptyTitle: {
    fontFamily: Fonts.garamond.bold,
    fontSize: 17,
    color: LogoColors.deepCharcoal,
    marginBottom: 4,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontFamily: Fonts.hanken.regular,
    fontSize: 12.5,
    color: '#8A7B6D',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 12,
  },
  emptyRefreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: LogoColors.deepCharcoal,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: BorderRadius.full,
    marginTop: 4,
  },
  emptyRefreshBtnText: {
    fontFamily: Fonts.hanken.bold,
    fontSize: 12.5,
    color: '#FFFFFF',
  },
});
