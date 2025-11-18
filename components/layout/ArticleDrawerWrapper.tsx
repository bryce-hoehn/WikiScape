import SharedDrawer from '@/components/layout/SharedDrawer';

interface ArticleDrawerWrapperProps {
  children: React.ReactNode;
}

export default function ArticleDrawerWrapper({ children }: ArticleDrawerWrapperProps) {
  return <SharedDrawer>{children}</SharedDrawer>;
}
