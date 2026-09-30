import { Component, lazy, Suspense, type ReactNode, type ErrorInfo } from 'react'
import { LiteratureMapProvider, useLiteratureMap } from './context/LiteratureMapContext'
import Layout from './components/Layout'
import HeroSection from './sections/HeroSection'
import SchoolsSection from './sections/SchoolsSection'

// Lazy-loaded below-the-fold sections for instant initial page load
const DebateSection = lazy(() => import('./sections/DebateSection'))
const GapSection = lazy(() => import('./sections/GapSection'))
const ClusterSection = lazy(() => import('./sections/ClusterSection'))
const BridgeSection = lazy(() => import('./sections/BridgeSection'))
const JournalSection = lazy(() => import('./sections/JournalSection'))
const PrismaSection = lazy(() => import('./sections/PrismaSection'))
const EvidenceSection = lazy(() => import('./sections/EvidenceSection'))
const WritingSection = lazy(() => import('./sections/WritingSection'))
const UploadSection = lazy(() => import('./sections/UploadSection'))
const DownloadSection = lazy(() => import('./sections/DownloadSection'))

function SectionSkeleton({ height = '450px' }: { height?: string }) {
  return (
    <div
      className="w-full flex items-center justify-center bg-[#FAF9F6] border-t border-b border-[#E7E3DB] py-20"
      style={{ minHeight: height }}
    >
      <div className="flex items-center gap-3 text-text-tertiary font-mono text-xs tracking-wider">
        <span className="inline-block w-2 h-2 rounded-full bg-accent-gold animate-ping" />
        <span>Synthesizing section...</span>
      </div>
    </div>
  )
}

interface ErrorBoundaryProps {
  title?: string
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`ErrorBoundary caught in [${this.props.title || 'Component'}]:`, error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 my-6 mx-auto max-w-2xl bg-[#FFF8F0] border border-[#E8D4B0] rounded-lg text-[#8C5B20] font-mono text-xs shadow-sm">
          <p className="font-bold text-sm mb-1">Section Notice: {this.props.title || 'Component'}</p>
          <p className="text-[#5A5C7A]">{this.state.error?.message || 'Error displaying this section.'}</p>
        </div>
      )
    }
    return this.props.children
  }
}

function AppContent() {
  const { isLoadingBundle } = useLiteratureMap();

  if (isLoadingBundle) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6] text-text-secondary font-mono tracking-wide">
        <div className="flex flex-col items-center gap-6">
          <div className="w-10 h-10 border-2 border-accent-gold/20 border-t-accent-gold rounded-full animate-spin" />
          <div className="flex items-center gap-2">
             <span className="w-2 h-2 bg-accent-gold rounded-full animate-pulse" />
             Synthesizing Literature Map...
          </div>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <ErrorBoundary title="Hero Constellation">
        <HeroSection />
      </ErrorBoundary>

      <div className="content-auto">
        <ErrorBoundary title="Schools of Thought">
          <SchoolsSection />
        </ErrorBoundary>
      </div>

      <div className="content-auto">
        <ErrorBoundary title="Debate Evolution">
          <Suspense fallback={<SectionSkeleton height="550px" />}>
            <DebateSection />
          </Suspense>
        </ErrorBoundary>
      </div>

      <div className="content-auto">
        <ErrorBoundary title="Research Gap">
          <Suspense fallback={<SectionSkeleton height="500px" />}>
            <GapSection />
          </Suspense>
        </ErrorBoundary>
      </div>

      <div id="analysis">
        <div className="content-auto">
          <ErrorBoundary title="Cluster Evolution">
            <Suspense fallback={<SectionSkeleton height="450px" />}>
              <ClusterSection />
            </Suspense>
          </ErrorBoundary>
        </div>

        <div className="content-auto">
          <ErrorBoundary title="Bridge Papers">
            <Suspense fallback={<SectionSkeleton height="450px" />}>
              <BridgeSection />
            </Suspense>
          </ErrorBoundary>
        </div>

        <div className="content-auto">
          <ErrorBoundary title="Journal Distribution">
            <Suspense fallback={<SectionSkeleton height="400px" />}>
              <JournalSection />
            </Suspense>
          </ErrorBoundary>
        </div>

        <div className="content-auto">
          <ErrorBoundary title="PRISMA Flow">
            <Suspense fallback={<SectionSkeleton height="500px" />}>
              <PrismaSection />
            </Suspense>
          </ErrorBoundary>
        </div>
      </div>

      <div className="content-auto">
        <ErrorBoundary title="Evidence Table">
          <Suspense fallback={<SectionSkeleton height="600px" />}>
            <EvidenceSection />
          </Suspense>
        </ErrorBoundary>
      </div>

      <div className="content-auto">
        <ErrorBoundary title="Writing Assistant">
          <Suspense fallback={<SectionSkeleton height="500px" />}>
            <WritingSection />
          </Suspense>
        </ErrorBoundary>
      </div>

      <div className="content-auto">
        <ErrorBoundary title="Upload Section">
          <Suspense fallback={<SectionSkeleton height="400px" />}>
            <UploadSection />
          </Suspense>
        </ErrorBoundary>
      </div>

      <div className="content-auto">
        <ErrorBoundary title="Download Center">
          <Suspense fallback={<SectionSkeleton height="350px" />}>
            <DownloadSection />
          </Suspense>
        </ErrorBoundary>
      </div>
    </Layout>
  );
}

export default function App() {
  return (
    <LiteratureMapProvider>
      <AppContent />
    </LiteratureMapProvider>
  )
}


