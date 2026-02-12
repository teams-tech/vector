'use client';

import dynamic from 'next/dynamic';
import styles from './page.module.css';

const MiaWidgetDynamic = dynamic(() => import('./MiaWidget'), {
  ssr: false,
  loading: () => <div className={styles['hero-widget-skeleton']} aria-hidden="true" />,
});

const ChatWidgetDynamic = dynamic(() => import('./ChatWidget'), {
  ssr: false,
  loading: () => (
    <button
      className={styles['chat-widget-skeleton']}
      aria-label="Loading chat widget"
      disabled
      type="button"
    />
  ),
});

export function LazyMiaWidget() {
  return <MiaWidgetDynamic />;
}

export function LazyChatWidget() {
  return <ChatWidgetDynamic />;
}
