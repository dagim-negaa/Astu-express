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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  Feather,
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from '@expo/vector-icons';

import * as Haptics from 'expo-haptics';

import { LogoColors, Fonts, Spacing, BorderRadius } from '@/constants/theme';
import { useStore } from '@/context/StoreContext';
import {
  FilterSheet,
  DEFAULT_FILTERS,
  type FilterState,
  type SortMode,
} from '@/components/filter-sheet';
import { getGarmentTypeLabel, matchesCategoryFilter as matchesCategory, resolveImageUrl } from '@astu/shared';
import { NoImagePlaceholder } from '@/components/no-image-placeholder';
import { prefetchProductImages } from '@/lib/imagePrefetch';

const HORIZONTAL_PADDING = 16;

const CATEGORIES = [
  { id: 'all', name: 'All' },
  { id: 'rtw', name: 'Ready-to-Wear' },
  { id: 'traditional', name: 'Habesha Kemis' },
  { id: 'outerwear', name: 'Jackets & Coats' },
  { id: 'accessories', name: 'Accessories' },
  { id: 'footwear', name: 'Footwear' },
];

export default function ShopScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string }>();
  const {
    addToCart,
    updateCartQuantity,
    toggleWishlist,
    isWishlisted,
    cartItems,
    products,
    fetchCatalog,
    isLoading,
  } = useStore();

  const [refreshing, setRefreshing] = useState(false);

  // Sync latest catalog on screen mount
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

  const initialFilter = params.category ? params.category : 'all';
  const [filterVisible, setFilterVisible] = useState(false);
  const [filters, setFilters] = useState<FilterState>({ ...DEFAULT_FILTERS, category: initialFilter });
  const [visibleCount, setVisibleCount] = useState(6);

  useEffect(() => {
    if (params.category) {
      setFilters((prev) => ({ ...prev, category: params.category! }));
    }
  }, [params.category]);

  useEffect(() => {
    setVisibleCount(6);
  }, [filters]);

  const filteredProducts = useMemo(() => {
    const sourceList = products && products.length > 0 ? products : [];
    const byCategory = sourceList.filter((p) =>
      matchesCategory(p.category, filters.category || 'all')
    );
    const byPrice = byCategory.filter((p) => {
      const price = p.priceEtb ?? p.price ?? 0;
      return price >= filters.low && price <= filters.high;
    });
    const byMaterial =
      filters.materials.length === 0
        ? byPrice
        : byPrice.filter((p) =>
            (p.materials ?? []).some((m: string) => filters.materials.includes(m))
          );
    const sorters: Record<SortMode, (a: any, b: any) => number> = {
      newest: () => 0,
      'price-asc': (a, b) => (a.priceEtb ?? a.price ?? 0) - (b.priceEtb ?? b.price ?? 0),
      'price-desc': (b, a) => (b.priceEtb ?? b.price ?? 0) - (a.priceEtb ?? a.price ?? 0),
    };
    return [...byMaterial].sort(sorters[filters.sort]);
  }, [filters, products]);

  // Silent background prefetch of upcoming items beyond visible viewport
  useEffect(() => {
    if (filteredProducts.length > 0) {
      prefetchProductImages(filteredProducts.slice(visibleCount, visibleCount + 4), 'preview');
    }
  }, [filteredProducts, visibleCount]);

  const filtersActive =
    (filters.materials.length > 0 ? 1 : 0) +
    (filters.sort !== 'newest' ? 1 : 0) +
    (filters.category !== 'all' ? 1 : 0) +
    (filters.low > DEFAULT_FILTERS.low || filters.high < DEFAULT_FILTERS.high ? 1 : 0);

  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 120;
    if (layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom) {
      if (visibleCount < filteredProducts.length) {
        setVisibleCount((prev) => prev + 4);
      }
    }
  };

  return (
    <View style={styles.root}>
      {/* 1. Centered Header Bar */}
      <SafeAreaView edges={['top']} style={styles.headerSafe}>
        <View style={styles.headerBar}>
          <Text style={styles.brandTitle}>ASTU GARMENT</Text>
        </View>
      </SafeAreaView>

      {/* Main Scroll Content */}
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 92 },
        ]}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={LogoColors.sharpRedOrange}
            colors={[LogoColors.sharpRedOrange]}
          />
        }
      >
        {/* 2. Search Pill Bar */}
        <View style={styles.searchSection}>
          <TouchableOpacity
            style={styles.searchBar}
            activeOpacity={0.88}
            onPress={() => router.push('/search')}
          >
            <Ionicons name="search" size={18} color="#9C8E80" style={styles.searchIcon} />
            <Text style={styles.searchPlaceholder} numberOfLines={1}>
              Search garments, silk, menen, tibeb...
            </Text>
          </TouchableOpacity>
        </View>

        {/* 3. Category Horizontal Pills */}
        <View style={styles.categoriesSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryPillsScroll}
          >
            {CATEGORIES.map((cat, idx) => {
              const isSelected = (filters.category || 'all') === cat.id;
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
                  onPress={() => setFilters((prev) => ({ ...prev, category: cat.id }))}
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

        {/* 4. Section Title & Filter Trigger */}
        <View style={styles.titleSection}>
          <View>
            <Text style={styles.pageTitle}>Atelier Collection</Text>
            <Text style={styles.itemCountText}>
              {filteredProducts.length} {filteredProducts.length === 1 ? 'spotlight piece' : 'pieces'} curated
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.filterButton, filtersActive > 0 && styles.filterButtonActive]}
            activeOpacity={0.8}
            onPress={() => setFilterVisible(true)}
          >
            <MaterialIcons
              name="tune"
              size={15}
              color={filtersActive > 0 ? LogoColors.sharpRedOrange : LogoColors.deepCharcoal}
            />
            <Text
              style={[
                styles.filterButtonText,
                filtersActive > 0 && { color: LogoColors.sharpRedOrange },
              ]}
            >
              Filter & Sort
            </Text>
            {filtersActive > 0 && (
              <View style={styles.filterCountBadge}>
                <Text style={styles.filterCountText}>{filtersActive}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* 5. Single Spotlight Showcase Cards (Instead of 2-Column Grid) */}
        {filteredProducts.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconCircle}>
              <MaterialCommunityIcons name="hanger" size={38} color={LogoColors.sharpRedOrange} />
            </View>
            <Text style={styles.emptyTitle}>No Pieces Found</Text>
            <Text style={styles.emptySubtitle}>
              {filtersActive > 0
                ? 'Try adjusting or clearing your filters to view more handcrafted garments.'
                : 'Our artisans are currently preparing new runway pieces.'}
            </Text>
            {filtersActive > 0 && (
              <TouchableOpacity
                style={styles.emptyButton}
                activeOpacity={0.88}
                onPress={() => setFilters(DEFAULT_FILTERS)}
              >
                <Text style={styles.emptyButtonText}>Reset All Filters</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.spotlightCardsContainer}>
            {filteredProducts.slice(0, visibleCount).map((product, index) => {
              const wishlisted = isWishlisted(product.id);
              const isOutOfStock = (product.stockQuantity ?? (product as any).stock ?? 1) === 0;
              const garmentType = getGarmentTypeLabel(product);
              const tagLabel = product.tag || (index % 2 === 0 ? 'Featured Masterpiece' : 'Atelier Spotlight');
              const cartItem = cartItems.find((ci) => ci.product.id === product.id);
              const quantityInCart = cartItem?.quantity || 0;

              return (
                <TouchableOpacity
                  key={product.id}
                  style={styles.showcaseCard}
                  activeOpacity={0.92}
                  onPress={() =>
                    router.push({
                      pathname: '/product-details',
                      params: { id: product.id },
                    })
                  }
                >
                  {/* Full-bleed Product Image or No Image Placeholder */}
                  {product.image ? (
                    <Image
                      source={{ uri: resolveImageUrl(product.image, 'preview') }}
                      style={StyleSheet.absoluteFill}
                      contentFit="cover"
                      transition={250}
                      cachePolicy="memory-disk"
                      priority={index < 4 ? 'high' : 'normal'}
                    />
                  ) : (
                    <NoImagePlaceholder
                      variant="showcase"
                      title={product.name || product.title}
                      style={StyleSheet.absoluteFill}
                    />
                  )}

                  {/* Dark Luxury Gradient Overlay */}
                  <LinearGradient
                    colors={['rgba(0,0,0,0.15)', 'rgba(0,0,0,0.35)', 'rgba(28,25,23,0.9)']}
                    style={StyleSheet.absoluteFill}
                  />

                  {/* Top Header Row over Image: Badge & Wishlist */}
                  <View style={styles.showcaseTopRow}>
                    <View style={styles.showcaseTagBadge}>
                      <Text style={styles.showcaseTagText}>{tagLabel}</Text>
                    </View>

                    <TouchableOpacity
                      style={styles.showcaseWishlistBtn}
                      activeOpacity={0.8}
                      onPress={(e) => {
                        e.stopPropagation();
                        toggleWishlist(product.id);
                      }}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons
                        name={wishlisted ? 'heart' : 'heart-outline'}
                        size={17}
                        color={wishlisted ? LogoColors.sharpRedOrange : LogoColors.deepCharcoal}
                      />
                    </TouchableOpacity>
                  </View>

                  {/* Bottom Content Overlay */}
                  <View style={styles.showcaseOverlayContent}>
                    <Text style={styles.showcaseCategory}>{garmentType}</Text>
                    <Text style={styles.showcaseTitle} numberOfLines={1}>
                      {product.name || product.title}
                    </Text>

                    <Text style={styles.showcaseSubtitle} numberOfLines={2}>
                      {product.description ||
                        product.subtitle ||
                        'Individually tailored in our Adama atelier with authentic Ethiopian craftsmanship.'}
                    </Text>

                    <View style={styles.showcaseActionRow}>
                      <Text style={styles.showcasePrice}>
                        {product.priceFormatted ||
                          `ETB ${(product.priceEtb ?? product.price ?? 0).toLocaleString()}`}
                      </Text>

                      <View style={styles.showcaseRightActions}>
                        {/* Inline Stepper if already in cart, otherwise Quick Add button */}
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
                                size={14}
                                color="#FFFFFF"
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
                              <Ionicons name="add" size={15} color="#FFFFFF" />
                            </TouchableOpacity>
                          </View>
                        ) : (
                          <TouchableOpacity
                            style={[
                              styles.quickAddBtn,
                              isOutOfStock && styles.quickAddBtnDisabled,
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
                            <Ionicons name="add" size={20} color="#FFFFFF" />
                          </TouchableOpacity>
                        )}

                        {/* View Piece Pill Button */}
                        <View style={styles.showcaseButton}>
                          <Text style={styles.showcaseButtonText}>View Piece</Text>
                          <Feather name="arrow-right" size={13} color="#FFFFFF" />
                        </View>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Filter Sheet Modal */}
      <FilterSheet
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        initial={filters}
        resultCount={filteredProducts.length}
        onApply={(newFilters) => setFilters(newFilters)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: LogoColors.white,
  },

  // 1. Header
  headerSafe: {
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

  // Scroll
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 8,
  },

  // 2. Search Section
  searchSection: {
    paddingHorizontal: HORIZONTAL_PADDING,
    marginBottom: 12,
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

  // 3. Category Horizontal Pills
  categoriesSection: {
    marginBottom: 16,
  },
  categoryPillsScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: HORIZONTAL_PADDING,
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

  // 4. Section Title & Filter Trigger
  titleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: HORIZONTAL_PADDING,
    marginBottom: 14,
  },
  pageTitle: {
    fontFamily: Fonts.garamond.bold,
    fontSize: 22,
    color: LogoColors.deepCharcoal,
  },
  itemCountText: {
    fontFamily: Fonts.hanken.regular,
    fontSize: 12,
    color: '#8A7B6D',
    marginTop: 1,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: LogoColors.cardBorder,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    gap: 6,
  },
  filterButtonActive: {
    borderColor: LogoColors.sharpRedOrange,
    backgroundColor: '#FFF8F0',
  },
  filterButtonText: {
    fontFamily: Fonts.hanken.bold,
    fontSize: 12,
    color: LogoColors.deepCharcoal,
  },
  filterCountBadge: {
    backgroundColor: LogoColors.sharpRedOrange,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterCountText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: Fonts.hanken.bold,
  },

  // 5. Single Spotlight Showcase Cards
  spotlightCardsContainer: {
    paddingHorizontal: HORIZONTAL_PADDING,
    gap: 16,
  },
  showcaseCard: {
    height: 248,
    borderRadius: 22,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: LogoColors.cardBorder,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  showcaseTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    zIndex: 2,
  },
  showcaseTagBadge: {
    alignSelf: 'flex-start',
    backgroundColor: LogoColors.softCreamTint,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  showcaseTagText: {
    fontFamily: Fonts.hanken.bold,
    fontSize: 10,
    color: LogoColors.sharpRedOrange,
    letterSpacing: 0.3,
  },
  showcaseWishlistBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.12,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  showcaseOverlayContent: {
    padding: 16,
    zIndex: 2,
  },
  showcaseCategory: {
    fontFamily: Fonts.hanken.bold,
    fontSize: 11,
    color: LogoColors.goldenOrange,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  showcaseTitle: {
    fontFamily: Fonts.garamond.bold,
    fontSize: 22,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  showcaseSubtitle: {
    fontFamily: Fonts.hanken.regular,
    fontSize: 12.5,
    color: '#E8DFD5',
    lineHeight: 17,
    marginBottom: 12,
  },
  showcaseActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  showcasePrice: {
    fontFamily: Fonts.hanken.bold,
    fontSize: 18,
    color: '#FFFFFF',
  },
  showcaseRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quickAddBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: LogoColors.deepCharcoal,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickAddBtnDisabled: {
    backgroundColor: 'rgba(50,50,50,0.5)',
  },
  inlineCardStepper: {
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(18, 18, 18, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    gap: 2,
  },
  cardStepperBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardStepperQty: {
    fontFamily: Fonts.hanken.bold,
    fontSize: 12.5,
    color: '#FFFFFF',
    minWidth: 18,
    textAlign: 'center',
  },
  showcaseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: LogoColors.sharpRedOrange,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: BorderRadius.full,
    gap: 5,
  },
  showcaseButtonText: {
    fontFamily: Fonts.hanken.bold,
    fontSize: 12,
    color: '#FFFFFF',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: LogoColors.cardBorder,
    marginHorizontal: HORIZONTAL_PADDING,
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#FFF4E6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontFamily: Fonts.garamond.bold,
    fontSize: 20,
    color: LogoColors.deepCharcoal,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontFamily: Fonts.hanken.regular,
    fontSize: 13,
    color: '#8A7B6D',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
  },
  emptyButton: {
    backgroundColor: LogoColors.deepCharcoal,
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: BorderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyButtonText: {
    fontFamily: Fonts.hanken.bold,
    fontSize: 13,
    color: '#FFFFFF',
  },
});
