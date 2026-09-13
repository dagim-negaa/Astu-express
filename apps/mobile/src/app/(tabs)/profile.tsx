import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';

import { LogoColors, Fonts, Spacing, BorderRadius } from '@/constants/theme';
import { useStore } from '@/context/StoreContext';
import { ConfirmModal } from '@/components/confirm-modal';

interface MenuRowProps {
  icon: React.ReactNode;
  label: string;
  onPress?: () => void;
  trailing?: React.ReactNode;
}

function MenuRow({ icon, label, onPress, trailing }: MenuRowProps) {
  const content = (
    <>
      <View style={styles.menuRowLeft}>
        <View style={styles.menuIconBox}>{icon}</View>
        <Text style={styles.menuRowLabel}>{label}</Text>
      </View>
      {trailing ?? (
        <Ionicons
          name="chevron-forward"
          size={18}
          color="#9C8E80"
        />
      )}
    </>
  );

  if (!onPress) {
    return <View style={styles.menuRow}>{content}</View>;
  }

  return (
    <TouchableOpacity
      style={styles.menuRow}
      activeOpacity={0.7}
      onPress={onPress}
    >
      {content}
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { currentUser, isAuthenticated, logout } = useStore();

  const [notificationsOn, setNotificationsOn] = useState(true);
  const [logoutConfirmVisible, setLogoutConfirmVisible] = useState(false);
  const [heritageModalVisible, setHeritageModalVisible] = useState(false);

  const userDisplayName = currentUser?.name || (isAuthenticated ? 'Customer' : 'Guest');
  const userEmail = currentUser?.email || '';
  const userPhone = currentUser?.phone || '';

  return (
    <View style={styles.root}>
      {/* Centered Header Bar */}
      <SafeAreaView edges={['top']} style={styles.headerContainer}>
        <View style={styles.header}>
          <View style={{ width: 65 }} />
          <Text style={styles.logoText}>ASTU GARMENT</Text>

          {isAuthenticated ? (
            <TouchableOpacity
              style={styles.logoutHeaderButton}
              activeOpacity={0.7}
              onPress={() => setLogoutConfirmVisible(true)}
            >
              <Feather name="log-out" size={15} color="#DC2626" />
              <Text style={styles.logoutHeaderText}>Sign Out</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 65 }} />
          )}
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 92 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card Header */}
        <View style={styles.profileHeaderCard}>
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person" size={40} color={LogoColors.sharpRedOrange} />
          </View>
          <Text style={styles.userName}>{userDisplayName}</Text>

          {isAuthenticated && userEmail ? (
            <View style={styles.userEmailWrap}>
              <Text style={styles.userEmailText}>{userEmail}</Text>
            </View>
          ) : null}

          {isAuthenticated && userPhone ? (
            <View style={styles.phoneWrap}>
              <Text style={styles.phoneText}>{userPhone}</Text>
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark" size={10} color="#FFFFFF" />
              </View>
            </View>
          ) : null}

          {/* Guest Action Buttons */}
          {!isAuthenticated && (
            <View style={styles.guestActionButtonsRow}>
              <TouchableOpacity
                style={styles.createAccountBtn}
                activeOpacity={0.88}
                onPress={() => {
                  router.push({ pathname: '/auth', params: { mode: 'signup' } });
                }}
              >
                <Text style={styles.createAccountText}>Create Account</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.signInBtn}
                activeOpacity={0.88}
                onPress={() => {
                  router.push({ pathname: '/auth', params: { mode: 'signin' } });
                }}
              >
                <Text style={styles.signInText}>Sign In</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Curated Menu Card */}
        <View style={styles.menuCard}>
          <MenuRow
            icon={<Ionicons name="receipt-outline" size={20} color={LogoColors.sharpRedOrange} />}
            label="Order History & Live Tracking"
            onPress={() => router.push('/orders')}
          />

          <View style={styles.menuDivider} />

          <MenuRow
            icon={<Ionicons name="heart-outline" size={20} color={LogoColors.sharpRedOrange} />}
            label="Saved Pieces & Wishlist"
            onPress={() => router.push('/wishlist')}
          />

          <View style={styles.menuDivider} />

          <MenuRow
            icon={<Ionicons name="notifications-outline" size={20} color={LogoColors.sharpRedOrange} />}
            label="Runway & Order Notifications"
            trailing={
              <Switch
                value={notificationsOn}
                onValueChange={setNotificationsOn}
                trackColor={{
                  false: '#E5E7EB',
                  true: LogoColors.sharpRedOrange,
                }}
                thumbColor="#FFFFFF"
              />
            }
          />

          <View style={styles.menuDivider} />

          <MenuRow
            icon={<Ionicons name="shield-checkmark-outline" size={20} color={LogoColors.deepCharcoal} />}
            label="Authenticity & Ethiopian Heritage"
            onPress={() => setHeritageModalVisible(true)}
          />
        </View>

        {/* App Version Info */}
        <View style={styles.footerInfo}>
          <Text style={styles.footerBrand}>ASTU GARMENT ATELIER</Text>
          <Text style={styles.footerVersion}>Version 1.0.0 • Adama, Ethiopia</Text>
        </View>
      </ScrollView>

      {/* Custom Luxury Sign Out Confirmation Modal */}
      <ConfirmModal
        visible={logoutConfirmVisible}
        title="Sign Out"
        message="Are you sure you want to sign out of your ASTU Garment account?"
        confirmText="Sign Out"
        cancelText="Cancel"
        isDestructive={true}
        onConfirm={() => {
          setLogoutConfirmVisible(false);
          logout();
        }}
        onCancel={() => setLogoutConfirmVisible(false)}
      />

      {/* Custom Luxury Heritage Information Modal */}
      <ConfirmModal
        visible={heritageModalVisible}
        title="ASTU Garment Heritage"
        message="Each ASTU Garment piece is handwoven with 100% natural Ethiopian cotton, dyed using ethical artisan techniques, and crafted in our master workshops in Adama, Ethiopia."
        confirmText="Understood"
        cancelText="Close"
        onConfirm={() => setHeritageModalVisible(false)}
        onCancel={() => setHeritageModalVisible(false)}
      />
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
  logoText: {
    fontFamily: Fonts.garamond.bold,
    fontSize: 22,
    color: LogoColors.deepCharcoal,
    letterSpacing: 4,
    textAlign: 'center',
  },
  logoutHeaderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: BorderRadius.full,
    backgroundColor: '#FEE2E2',
  },
  logoutHeaderText: {
    fontFamily: Fonts.hanken.bold,
    fontSize: 12,
    color: '#DC2626',
  },

  // Main Scroll
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  // Profile Header Card
  profileHeaderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: LogoColors.cardBorder,
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
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
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF4E6',
    borderWidth: 1.5,
    borderColor: LogoColors.goldenOrange,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  userName: {
    fontFamily: Fonts.garamond.bold,
    fontSize: 24,
    color: LogoColors.deepCharcoal,
    marginBottom: 4,
  },
  userEmailWrap: {
    marginBottom: 4,
  },
  userEmailText: {
    fontFamily: Fonts.hanken.regular,
    fontSize: 13,
    color: '#8A7B6D',
  },
  phoneWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  phoneText: {
    fontFamily: Fonts.hanken.medium,
    fontSize: 12.5,
    color: '#8A7B6D',
  },
  verifiedBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Guest Action Buttons
  guestActionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    width: '100%',
    paddingHorizontal: 8,
  },
  createAccountBtn: {
    flex: 1,
    backgroundColor: LogoColors.sharpRedOrange,
    paddingVertical: 10,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createAccountText: {
    fontFamily: Fonts.hanken.bold,
    fontSize: 13,
    color: '#FFFFFF',
  },
  signInBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: LogoColors.cardBorder,
    paddingVertical: 10,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signInText: {
    fontFamily: Fonts.hanken.bold,
    fontSize: 13,
    color: LogoColors.deepCharcoal,
  },

  // Menu Card
  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: LogoColors.cardBorder,
    paddingVertical: 4,
    marginBottom: 20,
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
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  menuRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FAF7F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuRowLabel: {
    fontFamily: Fonts.hanken.medium,
    fontSize: 14,
    color: LogoColors.deepCharcoal,
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#F7F3EE',
    marginLeft: 64,
  },

  // Footer
  footerInfo: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  footerBrand: {
    fontFamily: Fonts.hanken.bold,
    fontSize: 11,
    color: '#B5A89B',
    letterSpacing: 2,
  },
  footerVersion: {
    fontFamily: Fonts.hanken.regular,
    fontSize: 11,
    color: '#B5A89B',
    marginTop: 2,
  },
});
