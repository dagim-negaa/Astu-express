import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather, Ionicons, MaterialIcons } from '@expo/vector-icons';

import { LogoColors, Fonts, Spacing, BorderRadius } from '@/constants/theme';
import { useStore } from '@/context/StoreContext';
import { resolveImageUrl } from '@astu/shared';
import { NoImagePlaceholder } from '@/components/no-image-placeholder';

export default function OrdersScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { orders, wishlistCount, isAuthenticated } = useStore();

  return (
    <View style={styles.root}>
      {/* 1. Centered Header Bar */}
      <SafeAreaView edges={['top']} style={styles.headerContainer}>
        <View style={styles.header}>
          <View style={styles.sideSlot} />
          
          <Text style={styles.logoText}>ASTU GARMENT</Text>

          <View style={styles.sideSlot}>
            <TouchableOpacity
              style={styles.iconButton}
              activeOpacity={0.7}
              onPress={() => router.push('/wishlist')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="heart-outline" size={20} color={LogoColors.deepCharcoal} />
              {wishlistCount > 0 && (
                <View style={styles.badgeContainer}>
                  <Text style={styles.badgeText}>{wishlistCount}</Text>
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
          { paddingBottom: insets.bottom + 92 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleSection}>
          <Text style={styles.pageTitle}>Order History</Text>
          <Text style={styles.pageSubtitle}>
            Live atelier tracking and purchase archive.
          </Text>
        </View>

        {!isAuthenticated ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconCircle}>
              <MaterialIcons name="lock-outline" size={38} color={LogoColors.sharpRedOrange} />
            </View>
            <Text style={styles.emptyTitle}>Sign In to View Orders</Text>
            <Text style={styles.emptySubtitle}>
              Please sign in or create an account to access your live atelier order status and bespoke tracking.
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              activeOpacity={0.88}
              onPress={() =>
                router.push({
                  pathname: '/auth',
                  params: { mode: 'signin', redirect: '/orders' },
                })
              }
            >
              <Text style={styles.emptyButtonText}>Sign In / Create Account</Text>
            </TouchableOpacity>
          </View>
        ) : orders.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconCircle}>
              <MaterialIcons name="receipt-long" size={38} color={LogoColors.sharpRedOrange} />
            </View>
            <Text style={styles.emptyTitle}>No Orders Placed Yet</Text>
            <Text style={styles.emptySubtitle}>
              Your bespoke tailoring commissions and runway pieces will appear here once confirmed.
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              activeOpacity={0.88}
              onPress={() => router.push('/shop')}
            >
              <Text style={styles.emptyButtonText}>Discover Collections</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.ordersList}>
            {orders.map((order) => {
              const lowerStatus = (order.status || '').toLowerCase();
              const isDelivered = lowerStatus.includes('delivered') || lowerStatus.includes('confirmed');
              const isDisputed = lowerStatus.includes('cancel') || lowerStatus.includes('disputed');

              const badgeBg = isDelivered ? '#DCFCE7' : isDisputed ? '#FEE2E2' : '#FFF4E6';
              const badgeTextColor = isDelivered ? '#15803D' : isDisputed ? '#B91C1C' : LogoColors.sharpRedOrange;

              return (
                <View key={order.id} style={styles.orderCard}>
                  {order.image ? (
                    <Image
                      source={{ uri: resolveImageUrl(order.image, 'thumb') }}
                      style={styles.orderThumbnail}
                      contentFit="cover"
                      transition={200}
                      cachePolicy="memory-disk"
                    />
                  ) : (
                    <NoImagePlaceholder variant="thumb" style={styles.orderThumbnail} />
                  )}

                  <View style={styles.orderDetails}>
                    <View style={styles.orderTopRow}>
                      <View style={styles.orderIdCol}>
                        <Text style={styles.orderNumber}>
                          {order.id.startsWith('#') ? order.id : `#${order.id}`}
                        </Text>
                        <Text style={styles.orderTitle} numberOfLines={1}>
                          {order.title}
                        </Text>
                      </View>

                      <View style={[styles.statusPill, { backgroundColor: badgeBg }]}>
                        <Text style={[styles.statusText, { color: badgeTextColor }]}>
                          {order.status}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.orderDate}>{order.date}</Text>
                    <Text style={styles.orderPrice}>{order.price}</Text>

                    <TouchableOpacity
                      style={styles.detailsButton}
                      activeOpacity={0.85}
                      onPress={() =>
                        router.push({
                          pathname: '/track-order',
                          params: { id: order.id },
                        })
                      }
                    >
                      <Text style={styles.detailsButtonText}>Track Order</Text>
                      <Feather name="arrow-right" size={13} color="#FFFFFF" />
                    </TouchableOpacity>
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
  sideSlot: {
    width: 40,
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
  badgeContainer: {
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
  badgeText: {
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
  pageSubtitle: {
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
    marginTop: 8,
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
    backgroundColor: LogoColors.sharpRedOrange,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: BorderRadius.full,
  },
  emptyButtonText: {
    fontFamily: Fonts.hanken.bold,
    fontSize: 13.5,
    color: '#FFFFFF',
  },

  // Orders List
  ordersList: {
    gap: 12,
  },
  orderCard: {
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
  orderThumbnail: {
    width: 82,
    height: 102,
    borderRadius: 12,
    backgroundColor: '#FAF7F2',
  },
  orderDetails: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  orderTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderIdCol: {
    flex: 1,
    paddingRight: 8,
  },
  orderNumber: {
    fontFamily: Fonts.hanken.bold,
    fontSize: 11.5,
    color: '#8A7B6D',
    letterSpacing: 0.5,
  },
  orderTitle: {
    fontFamily: Fonts.garamond.bold,
    fontSize: 16,
    color: LogoColors.deepCharcoal,
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: {
    fontFamily: Fonts.hanken.bold,
    fontSize: 10,
    letterSpacing: 0.2,
  },
  orderDate: {
    fontFamily: Fonts.hanken.regular,
    fontSize: 11.5,
    color: '#8A7B6D',
  },
  orderPrice: {
    fontFamily: Fonts.hanken.bold,
    fontSize: 15,
    color: LogoColors.deepCharcoal,
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: LogoColors.deepCharcoal,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  detailsButtonText: {
    fontFamily: Fonts.hanken.bold,
    fontSize: 11.5,
    color: '#FFFFFF',
  },
});
