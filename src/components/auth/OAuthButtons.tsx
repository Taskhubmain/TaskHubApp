import React from 'react';
// imports removed because OAuth removed
import { useTranslation } from '@/hooks/useTranslation';

interface OAuthButtonsProps {
  onError?: (message: string) => void;
  mode?: 'login' | 'register';
}

export default function OAuthButtons({ onError, mode = 'login' }: OAuthButtonsProps) {
  const { t } = useTranslation();

  // OAuth убран — возвращаем пустой фрагмент
  return <></>;
}
