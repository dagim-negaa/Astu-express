import React, { useState, useEffect, useRef } from 'react';
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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';

import { LogoColors, Fonts, Spacing, BorderRadius } from '@/constants/theme';
import { useStore } from '@/context/StoreContext';
import { LoginSchema, RegisterSchema, validateData } from '@astu/shared';

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: 'signin' | 'signup'; redirect?: string }>();
  const { login, signUp } = useStore();

  const [mode, setMode] = useState<'signin' | 'signup'>(params.mode === 'signup' ? 'signup' : 'signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scrollViewRef = useRef<ScrollView>(null);

  // Active real-time cross check validation
  const hasConfirmText = confirmPassword.length > 0;
  const passwordsMatch = mode === 'signup' && hasConfirmText && password === confirmPassword;
  const passwordsMismatch = mode === 'signup' && hasConfirmText && password !== confirmPassword;

  useEffect(() => {
    if (params.mode === 'signup') {
      setMode('signup');
    } else if (params.mode === 'signin') {
      setMode('signin');
    }
  }, [params.mode]);

  const handleSwitchMode = (newMode: 'signin' | 'signup') => {
    setMode(newMode);
    setError(null);
    setConfirmPassword('');
    setShowConfirmPassword(false);
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 120);
  };

  const handleSubmit = async () => {
    setError(null);

    if (mode === 'signin') {
      const validation = validateData(LoginSchema, {
        email: email.trim(),
        password,
      });
      if (!validation.success) {
        setError(validation.error);
        return;
      }
    } else {
      if (!confirmPassword) {
        setError('Please confirm your password to register.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match. Please ensure both passwords match before registering.');
        return;
      }
      const validation = validateData(RegisterSchema, {
        name: name.trim(),
        email: email.trim(),
        password,
        phone: phone.trim() || undefined,
      });
      if (!validation.success) {
        setError(validation.error);
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === 'signin') {
        const res = await login(email.trim(), password);
        if (res.success) {
          handleSuccessRedirect();
        } else {
          setError(res.error || 'Invalid email or password.');
        }
      } else {
        const res = await signUp(name.trim(), email.trim(), password, phone.trim() || undefined);
        if (res.success) {
          handleSuccessRedirect();
        } else {
          setError(res.error || 'Failed to create account.');
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Authentication error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessRedirect = () => {
    if (params.redirect) {
      router.replace(params.redirect as any);
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
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
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather name="arrow-left" size={20} color={LogoColors.deepCharcoal} />
          </TouchableOpacity>

          <Text style={styles.logoText}>ASTU GARMENT</Text>

          <View style={{ width: 38 }} />
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView
        style={styles.flexOne}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollContainer}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 120 },
          ]}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag"
        >
          {/* Brand Emblem & Welcome Title */}
          <View style={styles.emblemSection}>
            <View style={styles.brandIconCircle}>
              <Feather name="user" size={30} color={LogoColors.sharpRedOrange} />
            </View>

            <Text style={styles.pageTitle}>
              {mode === 'signin' ? 'Welcome to ASTU Garment' : 'Join the Atelier'}
            </Text>
            <Text style={styles.pageSubtitle}>
              {mode === 'signin'
                ? 'Sign in to access your orders, bespoke fit profile & saved pieces.'
                : 'Create an account to commission tailored Ethiopian garments and track live artisan crafting.'}
            </Text>
          </View>

          {/* Segmented Capsule Pill Switcher */}
          <View style={styles.segmentContainer}>
            <TouchableOpacity
              style={[styles.segmentBtn, mode === 'signin' && styles.segmentBtnActive]}
              activeOpacity={0.88}
              onPress={() => handleSwitchMode('signin')}
            >
              <Text
                style={[
                  styles.segmentText,
                  mode === 'signin' && styles.segmentTextActive,
                ]}
              >
                Sign In
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.segmentBtn, mode === 'signup' && styles.segmentBtnActive]}
              activeOpacity={0.88}
              onPress={() => handleSwitchMode('signup')}
            >
              <Text
                style={[
                  styles.segmentText,
                  mode === 'signup' && styles.segmentTextActive,
                ]}
              >
                Create Account
              </Text>
            </TouchableOpacity>
          </View>

          {/* Error Banner */}
          {error && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle-outline" size={17} color="#DC2626" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Form Card */}
          <View style={styles.formCard}>
            {mode === 'signup' && (
              <View style={styles.inputField}>
                <Text style={styles.fieldLabel}>Full Name</Text>
                <View style={styles.inputBox}>
                  <Feather name="user" size={17} color="#9C8E80" style={styles.fieldIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. Almaz Bekele"
                    placeholderTextColor="#9C8E80"
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                  />
                </View>
              </View>
            )}

            <View style={styles.inputField}>
              <Text style={styles.fieldLabel}>Email Address</Text>
              <View style={styles.inputBox}>
                <Feather name="mail" size={17} color="#9C8E80" style={styles.fieldIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="you@domain.com"
                  placeholderTextColor="#9C8E80"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {mode === 'signup' && (
              <View style={styles.inputField}>
                <Text style={styles.fieldLabel}>Phone Number (Optional)</Text>
                <View style={styles.inputBox}>
                  <Feather name="phone" size={17} color="#9C8E80" style={styles.fieldIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="+251 91 123 4567"
                    placeholderTextColor="#9C8E80"
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>
            )}

            <View style={styles.inputField}>
              <Text style={styles.fieldLabel}>Password</Text>
              <View style={styles.inputBox}>
                <Feather name="lock" size={17} color="#9C8E80" style={styles.fieldIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="••••••••"
                  placeholderTextColor="#9C8E80"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  onFocus={scrollToBottom}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Feather
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={18}
                    color="#9C8E80"
                  />
                </TouchableOpacity>
              </View>
              {mode === 'signup' && password.length > 0 && password.length < 6 && (
                <Text style={styles.fieldHelperWarning}>
                  Password must be at least 6 characters.
                </Text>
              )}
            </View>

            {mode === 'signup' && (
              <View style={styles.inputField}>
                <View style={styles.fieldLabelRow}>
                  <Text style={styles.fieldLabel}>Confirm Password</Text>
                  {hasConfirmText && (
                    <View style={styles.matchBadgeRow}>
                      {passwordsMatch ? (
                        <View style={styles.matchBadgeSuccess}>
                          <Ionicons name="checkmark-circle" size={12} color="#15803D" />
                          <Text style={styles.matchBadgeSuccessText}>Passwords match</Text>
                        </View>
                      ) : (
                        <View style={styles.matchBadgeError}>
                          <Ionicons name="close-circle" size={12} color="#DC2626" />
                          <Text style={styles.matchBadgeErrorText}>Does not match</Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>

                <View
                  style={[
                    styles.inputBox,
                    passwordsMatch && styles.inputBoxSuccess,
                    passwordsMismatch && styles.inputBoxError,
                  ]}
                >
                  <Feather
                    name="shield"
                    size={17}
                    color={passwordsMatch ? '#15803D' : passwordsMismatch ? '#DC2626' : '#9C8E80'}
                    style={styles.fieldIcon}
                  />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Re-type your password"
                    placeholderTextColor="#9C8E80"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    onFocus={scrollToBottom}
                  />
                  {passwordsMatch && (
                    <Ionicons
                      name="checkmark-circle"
                      size={18}
                      color="#15803D"
                      style={{ marginRight: 8 }}
                    />
                  )}
                  {passwordsMismatch && (
                    <Ionicons
                      name="alert-circle"
                      size={18}
                      color="#DC2626"
                      style={{ marginRight: 8 }}
                    />
                  )}
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Feather
                      name={showConfirmPassword ? 'eye-off' : 'eye'}
                      size={18}
                      color={passwordsMatch ? '#15803D' : passwordsMismatch ? '#DC2626' : '#9C8E80'}
                    />
                  </TouchableOpacity>
                </View>

                {passwordsMismatch && (
                  <Text style={styles.fieldHelperError}>
                    Passwords do not match. Please re-enter the exact same password to continue.
                  </Text>
                )}
              </View>
            )}

            {/* Submit Action Pill Button */}
            <TouchableOpacity
              style={[
                styles.submitBtn,
                (passwordsMismatch || loading) && styles.submitBtnBlocked,
              ]}
              activeOpacity={0.88}
              disabled={loading || (mode === 'signup' && passwordsMismatch)}
              onPress={handleSubmit}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.submitBtnText}>
                    {mode === 'signin' ? 'Sign In' : 'Create Account'}
                  </Text>
                  <Feather name="arrow-right" size={17} color="#FFFFFF" />
                </>
              )}
            </TouchableOpacity>

            {/* Switch Mode Link */}
            <TouchableOpacity
              style={styles.switchModeWrap}
              activeOpacity={0.8}
              onPress={() => handleSwitchMode(mode === 'signin' ? 'signup' : 'signin')}
            >
              <Text style={styles.switchModeText}>
                {mode === 'signin'
                  ? "Don't have an account? "
                  : 'Already have an account? '}
                <Text style={styles.switchModeTextBold}>
                  {mode === 'signin' ? 'Create one' : 'Sign In'}
                </Text>
              </Text>
            </TouchableOpacity>
          </View>

          {/* Footer Heritage Note */}
          <Text style={styles.footerNote}>
            ASTU GARMENT ATELIER • Authentic Ethiopian Luxury
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

  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    alignItems: 'center',
  },

  // Emblem & Title Section
  emblemSection: {
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 10,
  },
  brandIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFF4E6',
    borderWidth: 1.5,
    borderColor: LogoColors.goldenOrange,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  pageTitle: {
    fontFamily: Fonts.garamond.bold,
    fontSize: 26,
    color: LogoColors.deepCharcoal,
    textAlign: 'center',
    marginBottom: 6,
  },
  pageSubtitle: {
    fontFamily: Fonts.hanken.regular,
    fontSize: 13.5,
    color: '#8A7B6D',
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 320,
  },

  // Segment Switcher
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#FAF7F2',
    borderRadius: BorderRadius.full,
    padding: 4,
    width: '100%',
    maxWidth: 380,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: LogoColors.cardBorder,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentBtnActive: {
    backgroundColor: LogoColors.sharpRedOrange,
    ...Platform.select({
      ios: {
        shadowColor: LogoColors.sharpRedOrange,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  segmentText: {
    fontFamily: Fonts.hanken.medium,
    fontSize: 13.5,
    color: '#786A5C',
  },
  segmentTextActive: {
    fontFamily: Fonts.hanken.bold,
    color: '#FFFFFF',
  },

  // Error Banner
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 14,
    marginBottom: 16,
    width: '100%',
    maxWidth: 380,
    gap: 8,
  },
  errorText: {
    fontFamily: Fonts.hanken.medium,
    fontSize: 12.5,
    color: '#DC2626',
    flex: 1,
  },

  // Form Card
  formCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: LogoColors.cardBorder,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  inputField: {
    marginBottom: 16,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  fieldLabel: {
    fontFamily: Fonts.hanken.semiBold,
    fontSize: 12.5,
    color: LogoColors.deepCharcoal,
  },
  matchBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  matchBadgeSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 4,
  },
  matchBadgeSuccessText: {
    fontFamily: Fonts.hanken.medium,
    fontSize: 11,
    color: '#15803D',
  },
  matchBadgeError: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 4,
  },
  matchBadgeErrorText: {
    fontFamily: Fonts.hanken.medium,
    fontSize: 11,
    color: '#DC2626',
  },
  inputBox: {
    height: 50,
    backgroundColor: '#FAF7F2',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: LogoColors.cardBorder,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  inputBoxSuccess: {
    borderColor: '#16A34A',
    backgroundColor: '#F7FDF9',
  },
  inputBoxError: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
  fieldHelperError: {
    fontFamily: Fonts.hanken.medium,
    fontSize: 11.5,
    color: '#DC2626',
    marginTop: 5,
    paddingHorizontal: 4,
  },
  fieldHelperWarning: {
    fontFamily: Fonts.hanken.regular,
    fontSize: 11.5,
    color: '#B45309',
    marginTop: 5,
    paddingHorizontal: 4,
  },
  fieldIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontFamily: Fonts.hanken.regular,
    fontSize: 14,
    color: LogoColors.deepCharcoal,
  },
  submitBtn: {
    backgroundColor: LogoColors.sharpRedOrange,
    height: 52,
    borderRadius: BorderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
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
  submitBtnBlocked: {
    opacity: 0.55,
  },
  submitBtnText: {
    fontFamily: Fonts.hanken.bold,
    fontSize: 15,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  switchModeWrap: {
    alignItems: 'center',
    marginTop: 18,
  },
  switchModeText: {
    fontFamily: Fonts.hanken.regular,
    fontSize: 13,
    color: '#8A7B6D',
  },
  switchModeTextBold: {
    fontFamily: Fonts.hanken.bold,
    color: LogoColors.sharpRedOrange,
  },

  footerNote: {
    fontFamily: Fonts.hanken.bold,
    fontSize: 11,
    color: '#B5A89B',
    letterSpacing: 1.5,
    marginTop: 32,
    textAlign: 'center',
  },
});
