import React, { useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  Feather,
  Ionicons,
  MaterialIcons,
  MaterialCommunityIcons,
} from '@expo/vector-icons';

import { LogoColors, Fonts, Spacing, BorderRadius } from '@/constants/theme';
import { useStore } from '@/context/StoreContext';
import { searchProducts } from '@/lib/search-engine';
import { resolveImageUrl } from '@astu/shared';
import { NoImagePlaceholder } from '@/components/no-image-placeholder';

const POPULAR_SUGGESTIONS = [
  'Tekur Shemiz',
  'Semayawi T-shirt',
  'Arenguade Kemis',
  'Gold Tibeb',
  'Pure Silk',
  'Menen Shemiz',
];

export default function GlobalSearchScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ q?: string; id?: string }>();
  const { products } = useStore();

  const [searchQuery, setSearchQuery] = useState(params.q || '');
  const [recents, setRecents] = useState<string[]>([]);
  const inputRef = useRef<TextInput>(null);

  // Search Results Computation powered by Natural Language Search Engine
  const searchResults = useMemo(() => {
    const q = searchQuery.trim();
    if (!q) return [];
    return searchProducts(q, products).map((r) => r.product);
  }, [searchQuery, products]);

  // Curated Trending Pieces
  const trendingPieces = useMemo(() => {
    const featured = (products as any[]).filter(
      (p) => p.is_featured === true || p.tag === 'Featured'
    );
    if (featured.length > 0) return featured.slice(0, 6);
    return (products as any[]).slice(0, 6);
  }, [products]);

  const handleSelectProduct = (id: string) => {
    if (searchQuery.trim()) {
      pushRecent(searchQuery.trim());
    }
    router.push({
      pathname: '/product-details',
      params: { id },
    });
  };

  const pushRecent = (term: string) => {
    const cleaned = term.trim();
    if (!cleaned) return;
    setRecents((prev) => [cleaned, ...prev.filter((t) => t !== cleaned)].slice(0, 8));
  };

  const handleSelectTerm = (term: string) => {
    setSearchQuery(term);
    pushRecent(term);
    inputRef.current?.blur();
  };

  return (
    <View style={styles.root}>
      {/* Search Header Bar */}
      <SafeAreaView edges={['top']} style={styles.headerContainer}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            activeOpacity={0.7}
            onPress={() => router.back()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Feather name="arrow-left" size={20} color={LogoColors.deepCharcoal} />
          </TouchableOpacity>

          <View style={styles.searchInputWrap}>
            <Ionicons
              name="search"
              size={18}
              color={LogoColors.sharpRedOrange}
              style={styles.searchIcon}
            />
            <TextInput
              ref={inputRef}
              style={styles.searchInput}
              placeholder="Search garments, silk, menen, shoes..."
              placeholderTextColor="#9C8E80"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCorrect={false}
              returnKeyType="search"
              autoFocus={true}
              onSubmitEditing={() => {
                if (searchQuery.trim()) pushRecent(searchQuery.trim());
              }}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                style={styles.clearButton}
                activeOpacity={0.7}
                onPress={() => {
                  setSearchQuery('');
                  inputRef.current?.focus();
                }}
              >
                <Ionicons
                  name="close-circle"
                  size={18}
                  color="#9C8E80"
                />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={styles.cancelButton}
            activeOpacity={0.7}
            onPress={() => router.back()}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Main Search Content */}
      <KeyboardAvoidingView
        style={styles.flexOne}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 40 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {searchQuery.trim() === '' ? (
            <>
              {/* Prompt Hero Card */}
              <View style={styles.promptHeroCard}>
                <View style={styles.promptIconCircle}>
                  <MaterialIcons
                    name="auto-awesome"
                    size={24}
                    color={LogoColors.sharpRedOrange}
                  />
                </View>
                <Text style={styles.promptHeroTitle}>Discover Bespoke Elegance</Text>
                <Text style={styles.promptHeroSubtitle}>
                  Search across authentic Ethiopian heritage weaves, bespoke tailoring, and modern silhouettes.
                </Text>
              </View>

              {/* Recent Searches */}
              {recents.length > 0 && (
                <View style={styles.sectionBlock}>
                  <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionLabel}>RECENT SEARCHES</Text>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => setRecents([])}
                    >
                      <Text style={styles.clearRecentsText}>Clear</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.chipGrid}>
                    {recents.map((term) => (
                      <TouchableOpacity
                        key={term}
                        style={styles.recentChip}
                        activeOpacity={0.8}
                        onPress={() => handleSelectTerm(term)}
                      >
                        <MaterialCommunityIcons
                          name="history"
                          size={14}
                          color="#8A7B6D"
                        />
                        <Text style={styles.recentChipText}>{term}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* Trending Pieces in Atelier */}
              {trendingPieces.length > 0 && (
                <View style={styles.sectionBlock}>
                  <Text style={styles.sectionLabel}>TRENDING IN ATELIER</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.trendingCarousel}
                  >
                    {trendingPieces.map((piece) => (
                      <TouchableOpacity
                        key={`trend-${piece.id}`}
                        style={styles.trendCard}
                        activeOpacity={0.88}
                        onPress={() => handleSelectProduct(piece.id)}
                      >
                        {piece.image ? (
                          <Image
                            source={{ uri: resolveImageUrl(piece.image, 'preview') }}
                            style={styles.trendImage}
                            contentFit="cover"
                            transition={150}
                            cachePolicy="memory-disk"
                          />
                        ) : (
                          <NoImagePlaceholder variant="thumb" style={styles.trendImage} />
                        )}
                        <View style={styles.trendInfo}>
                          <Text style={styles.trendName} numberOfLines={1}>
                            {piece.name}
                          </Text>
                          <Text style={styles.trendCategory} numberOfLines={1}>
                            {piece.category}
                          </Text>
                          <Text style={styles.trendPrice}>
                            {piece.priceFormatted || `ETB ${(piece.priceEtb ?? piece.price ?? 0).toLocaleString()}`}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* Popular Curated Categories */}
              <View style={styles.sectionBlock}>
                <Text style={styles.sectionLabel}>CURATED SEARCHES</Text>
                <View style={styles.chipGrid}>
                  {POPULAR_SUGGESTIONS.map((item) => (
                    <TouchableOpacity
                      key={item}
                      style={styles.popularChip}
                      activeOpacity={0.8}
                      onPress={() => handleSelectTerm(item)}
                    >
                      <Feather
                        name="arrow-up-right"
                        size={12}
                        color={LogoColors.sharpRedOrange}
                      />
                      <Text style={styles.popularChipText}>{item}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </>
          ) : searchResults.length > 0 ? (
            /* Results Available */
            <View style={styles.resultsContainer}>
              <View style={styles.resultsCountBar}>
                <Text style={styles.resultsCountText}>
                  {searchResults.length}{' '}
                  {searchResults.length === 1 ? 'PIECE FOUND' : 'PIECES FOUND'}
                </Text>
              </View>

              <View style={styles.resultsList}>
                {searchResults.map((product) => (
                  <TouchableOpacity
                    key={product.id}
                    style={styles.resultItemCard}
                    activeOpacity={0.88}
                    onPress={() => handleSelectProduct(product.id)}
                  >
                    {product.image ? (
                      <Image
                        source={{ uri: resolveImageUrl(product.image, 'preview') }}
                        style={styles.resultItemThumb}
                        contentFit="cover"
                        transition={150}
                        cachePolicy="memory-disk"
                      />
                    ) : (
                      <NoImagePlaceholder variant="thumb" style={styles.resultItemThumb} />
                    )}
                    <View style={styles.resultItemInfo}>
                      <Text style={styles.resultItemName} numberOfLines={1}>
                        {product.name}
                      </Text>
                      <Text style={styles.resultItemSubtitle} numberOfLines={1}>
                        {product.category} · {product.subtitle || 'Atelier Garment'}
                      </Text>
                      {product.materials && product.materials.length > 0 && (
                        <View style={styles.materialTagRow}>
                          <Text style={styles.materialTagText} numberOfLines={1}>
                            {product.materials.join(' · ')}
                          </Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.resultItemPriceCol}>
                      <Text style={styles.resultItemPrice}>
                        {product.priceFormatted || `ETB ${(product.priceEtb ?? product.price ?? 0).toLocaleString()}`}
                      </Text>
                      <Feather
                        name="chevron-right"
                        size={16}
                        color="#9C8E80"
                      />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : (
            /* No Results Match Query */
            <View style={styles.noResultsBox}>
              <View style={styles.noResultsIconWrap}>
                <Feather
                  name="search"
                  size={32}
                  color={LogoColors.sharpRedOrange}
                />
              </View>
              <Text style={styles.noResultsTitle}>No pieces match “{searchQuery}”</Text>
              <Text style={styles.noResultsSubtitle}>
                Try checking the spelling, or search with broad terms such as silk, dress, or shemiz.
              </Text>

              <View style={styles.noResultsSuggestions}>
                <Text style={styles.noResultsSuggestHeader}>TRY EXPLORING:</Text>
                <View style={styles.chipGrid}>
                  {POPULAR_SUGGESTIONS.slice(0, 4).map((term) => (
                    <TouchableOpacity
                      key={term}
                      style={styles.popularChip}
                      activeOpacity={0.8}
                      onPress={() => handleSelectTerm(term)}
                    >
                      <Text style={styles.popularChipText}>{term}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          )}

          <Text style={styles.atelierFooterHint}>
            ASTU Garment · Authentic Ethiopian Luxury Index
          </Text>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 10,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: LogoColors.cardBorder,
  },
  searchInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: BorderRadius.full,
    backgroundColor: '#FAF7F2',
    borderWidth: 1,
    borderColor: LogoColors.cardBorder,
    paddingHorizontal: 14,
    gap: 8,
  },
  searchIcon: {
    marginRight: -2,
  },
  searchInput: {
    flex: 1,
    fontFamily: Fonts.hanken.medium,
    fontSize: 13.5,
    color: LogoColors.deepCharcoal,
    paddingVertical: 0,
  },
  clearButton: {
    padding: 3,
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  cancelButtonText: {
    fontFamily: Fonts.hanken.bold,
    fontSize: 13.5,
    color: LogoColors.sharpRedOrange,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  promptHeroCard: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingVertical: 24,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: LogoColors.cardBorder,
    marginBottom: 20,
    gap: 6,
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
  promptIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFF4E6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  promptHeroTitle: {
    fontFamily: Fonts.garamond.bold,
    fontSize: 21,
    color: LogoColors.deepCharcoal,
    textAlign: 'center',
    marginTop: 2,
  },
  promptHeroSubtitle: {
    fontFamily: Fonts.hanken.regular,
    fontSize: 13,
    color: '#8A7B6D',
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 290,
  },
  sectionBlock: {
    marginBottom: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionLabel: {
    fontFamily: Fonts.hanken.bold,
    fontSize: 11,
    letterSpacing: 1.2,
    color: LogoColors.goldenOrange,
    marginBottom: 10,
  },
  clearRecentsText: {
    fontFamily: Fonts.hanken.bold,
    fontSize: 11.5,
    color: LogoColors.sharpRedOrange,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  recentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: BorderRadius.full,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: LogoColors.cardBorder,
  },
  recentChipText: {
    fontFamily: Fonts.hanken.medium,
    fontSize: 12.5,
    color: LogoColors.deepCharcoal,
  },
  trendingCarousel: {
    gap: 12,
    paddingRight: 16,
  },
  trendCard: {
    width: 140,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: LogoColors.cardBorder,
    overflow: 'hidden',
    padding: 6,
  },
  trendImage: {
    width: '100%',
    height: 140,
    borderRadius: 14,
    backgroundColor: '#FAF7F2',
  },
  trendInfo: {
    padding: 6,
  },
  trendName: {
    fontFamily: Fonts.garamond.bold,
    fontSize: 14,
    color: LogoColors.deepCharcoal,
  },
  trendCategory: {
    fontFamily: Fonts.hanken.regular,
    fontSize: 11,
    color: '#8A7B6D',
    marginVertical: 2,
  },
  trendPrice: {
    fontFamily: Fonts.hanken.bold,
    fontSize: 13,
    color: LogoColors.sharpRedOrange,
  },
  popularChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: BorderRadius.full,
    backgroundColor: '#FFF4E6',
    borderWidth: 1,
    borderColor: '#FDE2C4',
  },
  popularChipText: {
    fontFamily: Fonts.hanken.bold,
    fontSize: 12,
    color: LogoColors.sharpRedOrange,
  },
  resultsContainer: {
    marginBottom: 20,
  },
  resultsCountBar: {
    marginBottom: 12,
  },
  resultsCountText: {
    fontFamily: Fonts.hanken.bold,
    fontSize: 11.5,
    letterSpacing: 1.2,
    color: LogoColors.goldenOrange,
  },
  resultsList: {
    gap: 12,
  },
  resultItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: LogoColors.cardBorder,
    padding: 10,
    gap: 12,
  },
  resultItemThumb: {
    width: 68,
    height: 78,
    borderRadius: 12,
    backgroundColor: '#FAF7F2',
  },
  resultItemInfo: {
    flex: 1,
  },
  resultItemName: {
    fontFamily: Fonts.garamond.bold,
    fontSize: 15.5,
    color: LogoColors.deepCharcoal,
  },
  resultItemSubtitle: {
    fontFamily: Fonts.hanken.regular,
    fontSize: 12,
    color: '#8A7B6D',
    marginTop: 2,
  },
  materialTagRow: {
    marginTop: 4,
  },
  materialTagText: {
    fontFamily: Fonts.hanken.medium,
    fontSize: 10.5,
    color: LogoColors.goldenOrange,
  },
  resultItemPriceCol: {
    alignItems: 'flex-end',
    gap: 4,
  },
  resultItemPrice: {
    fontFamily: Fonts.hanken.bold,
    fontSize: 13.5,
    color: LogoColors.deepCharcoal,
  },
  noResultsBox: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: LogoColors.cardBorder,
    paddingHorizontal: 20,
  },
  noResultsIconWrap: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#FFF4E6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  noResultsTitle: {
    fontFamily: Fonts.garamond.bold,
    fontSize: 20,
    color: LogoColors.deepCharcoal,
    marginBottom: 6,
    textAlign: 'center',
  },
  noResultsSubtitle: {
    fontFamily: Fonts.hanken.regular,
    fontSize: 13,
    color: '#8A7B6D',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
    maxWidth: 270,
  },
  noResultsSuggestions: {
    width: '100%',
    alignItems: 'center',
  },
  noResultsSuggestHeader: {
    fontFamily: Fonts.hanken.bold,
    fontSize: 11,
    letterSpacing: 1,
    color: LogoColors.goldenOrange,
    marginBottom: 10,
  },
  atelierFooterHint: {
    fontFamily: Fonts.hanken.regular,
    fontSize: 11,
    color: '#B5A89B',
    textAlign: 'center',
    marginTop: 24,
  },
});
