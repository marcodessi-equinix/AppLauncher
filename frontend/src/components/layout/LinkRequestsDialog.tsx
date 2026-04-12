import React from 'react';
import { CheckCircle2, ClipboardList, MessageSquarePlus, UserRound, X } from 'lucide-react';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { useI18n } from '../../lib/i18n';
import { createLinkRequest, fetchLinkRequests, getErrorMessage, updateLinkRequest } from '../../lib/api';
import { useStore } from '../../store/useStore';
import type { LinkRequest, LinkRequestStatus } from '../../types/linkRequest';

interface LinkRequestsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const statusOrder: LinkRequestStatus[] = ['open', 'implemented'];

const urlSplitPattern = /(https?:\/\/[^\s]+)/gi;
const exactUrlPattern = /^https?:\/\/[^\s]+$/i;

const renderRequestMessage = (message: string) => {
  const lines = message.split(/\r?\n/);

  return lines.map((line, lineIndex) => {
    const segments = line.split(urlSplitPattern);

    return (
      <React.Fragment key={`line-${lineIndex}`}>
        {segments.map((segment, segmentIndex) => {
          if (!segment) {
            return null;
          }

          if (exactUrlPattern.test(segment)) {
            return (
              <a
                key={`segment-${lineIndex}-${segmentIndex}`}
                href={segment}
                target="_blank"
                rel="noreferrer noopener"
                className="font-medium text-sky-300 underline decoration-sky-400/60 underline-offset-4 transition-colors hover:text-sky-200"
              >
                {segment}
              </a>
            );
          }

          return <React.Fragment key={`segment-${lineIndex}-${segmentIndex}`}>{segment}</React.Fragment>;
        })}
        {lineIndex < lines.length - 1 ? <br /> : null}
      </React.Fragment>
    );
  });
};

export const LinkRequestsDialog: React.FC<LinkRequestsDialogProps> = ({ isOpen, onClose }) => {
  const { t, locale } = useI18n();
  const isAdmin = useStore((state) => state.isAdmin);
  const clientId = useStore((state) => state.clientId);
  const initClientIdentity = useStore((state) => state.initClientIdentity);
  const [message, setMessage] = React.useState('');
  const [requesterLabel, setRequesterLabel] = React.useState('');
  const [submitState, setSubmitState] = React.useState<'idle' | 'submitting' | 'success'>('idle');
  const [requests, setRequests] = React.useState<LinkRequest[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [updatingId, setUpdatingId] = React.useState<number | null>(null);
  const showSuccessDialog = !isAdmin && submitState === 'success';

  React.useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (!clientId) {
      void initClientIdentity();
    }
  }, [clientId, initClientIdentity, isOpen]);

  React.useEffect(() => {
    if (!isOpen) {
      setMessage('');
      setRequesterLabel('');
      setSubmitState('idle');
      setError(null);
      return;
    }

    if (!isAdmin) {
      return;
    }

    let cancelled = false;

    const loadRequests = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await fetchLinkRequests();
        if (cancelled) {
          return;
        }

        setRequests(data);
      } catch (loadError) {
        if (!cancelled) {
          setError(getErrorMessage(loadError, t('requests.loadError')));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadRequests();

    return () => {
      cancelled = true;
    };
  }, [isAdmin, isOpen, t]);

  React.useEffect(() => {
    if (isAdmin || submitState !== 'success') {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setSubmitState('idle');
      onClose();
    }, 2600);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isAdmin, onClose, submitState]);

  const formatDate = React.useCallback((value: string | null) => {
    if (!value) {
      return '—';
    }

    try {
      return new Intl.DateTimeFormat(locale, {
        timeZone: 'Europe/Berlin',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).format(new Date(value));
    } catch {
      return value;
    }
  }, [locale]);

  const sortRequests = React.useCallback((entries: LinkRequest[]) => {
    return [...entries].sort((left, right) => {
      const statusDelta = statusOrder.indexOf(left.status) - statusOrder.indexOf(right.status);
      if (statusDelta !== 0) {
        return statusDelta;
      }

      return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
    });
  }, []);

  const upsertRequest = React.useCallback((nextRequest: LinkRequest) => {
    setRequests((current) => {
      const hasExisting = current.some((entry) => entry.id === nextRequest.id);
      const nextEntries = hasExisting
        ? current.map((entry) => (entry.id === nextRequest.id ? nextRequest : entry))
        : [nextRequest, ...current];

      return sortRequests(nextEntries);
    });
  }, [sortRequests]);

  const handleSubmit = async () => {
    if (!clientId || message.trim().length < 5) {
      return;
    }

    try {
      setSubmitState('submitting');
      setError(null);
      await createLinkRequest({
        clientId,
        message: message.trim(),
        requesterLabel: requesterLabel.trim() || undefined,
      });
      setMessage('');
      setRequesterLabel('');
      setSubmitState('success');
    } catch (submitError) {
      setSubmitState('idle');
      setError(getErrorMessage(submitError, t('requests.submitError')));
    }
  };

  const handleStatusSave = async (requestId: number, status: LinkRequestStatus) => {
    try {
      setUpdatingId(requestId);
      setError(null);
      const updated = await updateLinkRequest(requestId, { status });
      if (updated) {
        upsertRequest(updated);
      }
    } catch (updateError) {
      setError(getErrorMessage(updateError, t('requests.updateError')));
    } finally {
      setUpdatingId((current) => (current === requestId ? null : current));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      {showSuccessDialog ? (
        <DialogContent className="glass-card max-w-md overflow-hidden rounded-3xl border border-emerald-500/22 bg-[linear-gradient(180deg,rgba(7,18,14,0.96),rgba(4,12,9,0.92))] p-0 text-foreground shadow-[0_28px_80px_-30px_rgba(16,185,129,0.45)] backdrop-blur-xl [&>button]:hidden">
          <div className="p-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-500/12 text-emerald-300 shadow-[0_0_30px_-18px_rgba(16,185,129,0.8)]">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <div className="mt-5 space-y-2">
              <DialogTitle className="text-xl font-black tracking-tight text-foreground">
                {t('requests.successTitle')}
              </DialogTitle>
              <DialogDescription className="text-sm leading-relaxed text-foreground/78">
                {t('requests.success')}
              </DialogDescription>
            </div>
          </div>
        </DialogContent>
      ) : (
        <DialogContent className="glass-card w-[min(96vw,78rem)] max-w-5xl overflow-hidden rounded-3xl border border-[hsl(var(--glass-border)/0.1)] bg-background/92 p-0 text-foreground shadow-2xl backdrop-blur-xl [&>button]:hidden">
          <div className="overflow-hidden rounded-3xl">
            <div className="border-b border-[hsl(var(--glass-border)/0.05)] px-8 py-6">
              <DialogHeader className="space-y-0 text-left">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[hsl(var(--glass-border)/0.08)] bg-[hsl(var(--glass-highlight)/0.05)] text-primary/80 shadow-[0_0_20px_-12px_hsl(var(--glow)/0.45)]">
                      {isAdmin ? <ClipboardList className="h-5 w-5" /> : <MessageSquarePlus className="h-5 w-5" />}
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.24em] text-primary/80">
                        <MessageSquarePlus className="h-3.5 w-3.5" />
                        {t('requests.badge')}
                      </div>
                      <DialogTitle className="text-2xl font-black tracking-tight text-foreground md:text-[1.75rem]">
                        {isAdmin ? t('requests.adminTitle') : t('requests.userTitle')}
                      </DialogTitle>
                      <DialogDescription className="max-w-2xl text-sm leading-relaxed text-muted-foreground/80">
                        {isAdmin ? t('requests.adminDescription') : t('requests.userDescription')}
                      </DialogDescription>
                    </div>
                  </div>

                  <DialogClose asChild>
                    <button
                      type="button"
                      title={t('common.close')}
                      aria-label={t('common.close')}
                      className="p-2 hover:bg-[hsl(var(--glass-highlight)/0.05)] rounded-xl transition-colors text-muted-foreground hover:text-foreground active:scale-90"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </DialogClose>
                </div>
              </DialogHeader>
            </div>

            <div className="max-h-[80vh] overflow-y-auto px-8 py-6 custom-scrollbar">
              {error ? (
                <div className="mb-5 rounded-2xl border border-rose-500/20 bg-rose-500/8 px-4 py-3 text-sm text-rose-200/95">
                  {error}
                </div>
              ) : null}

              {isAdmin ? (
                isLoading ? (
                  <div className="flex min-h-48 items-center justify-center text-sm text-muted-foreground/70">
                    {t('common.loading')}
                  </div>
                ) : requests.length === 0 ? (
                  <div className="flex min-h-48 flex-col items-center justify-center gap-3 text-center text-muted-foreground/65">
                    <ClipboardList className="h-10 w-10 opacity-30" />
                    <p className="text-sm font-medium">{t('requests.empty')}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {requests.map((request) => {
                      return (
                        <section
                          key={request.id}
                          className="rounded-[1.4rem] border border-[hsl(var(--glass-border)/0.08)] bg-[linear-gradient(180deg,hsl(var(--card)/0.58),hsl(var(--card)/0.32))] p-5 shadow-[0_18px_40px_-28px_rgba(0,0,0,0.55)]"
                        >
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div className="min-w-0 flex-1 space-y-3">
                              <div className="flex flex-wrap items-center gap-2">
                                {request.requesterLabel ? (
                                  <span className="inline-flex items-center gap-1 rounded-full border border-[hsl(var(--glass-border)/0.08)] bg-[hsl(var(--glass-highlight)/0.04)] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-foreground/80">
                                    <UserRound className="h-3 w-3" />
                                    {request.requesterLabel}
                                  </span>
                                ) : null}
                              </div>

                              <div className="max-w-3xl text-sm leading-relaxed text-foreground/88">
                                {renderRequestMessage(request.message)}
                              </div>

                              <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground/75">
                                <div className="whitespace-nowrap">
                                  <span className="font-semibold text-foreground/82">{t('requests.requestedAt')}: </span>
                                  {formatDate(request.createdAt)}
                                </div>
                                {request.status === 'implemented' ? (
                                  <div className="whitespace-nowrap">
                                    <span className="font-semibold text-foreground/82">{t('requests.completedAt')}: </span>
                                    {formatDate(request.updatedAt)}
                                  </div>
                                ) : null}
                              </div>
                            </div>

                            <div className="flex w-full shrink-0 flex-row justify-start gap-2 lg:w-auto lg:justify-end">
                              <Button
                                type="button"
                                size="sm"
                                className={request.status === 'open'
                                  ? 'rounded-xl bg-rose-600 text-white hover:bg-rose-500'
                                  : 'rounded-xl border border-rose-500/30 bg-transparent text-rose-300 hover:bg-rose-500/10 hover:text-rose-200'}
                                variant="outline"
                                disabled={updatingId === request.id}
                                onClick={() => void handleStatusSave(request.id, 'open')}
                              >
                                {t('requests.statusOpen')}
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                className={request.status === 'implemented'
                                  ? 'rounded-xl bg-emerald-600 text-white hover:bg-emerald-500'
                                  : 'rounded-xl border border-emerald-500/30 bg-transparent text-emerald-300 hover:bg-emerald-500/10 hover:text-emerald-200'}
                                variant="outline"
                                disabled={updatingId === request.id}
                                onClick={() => void handleStatusSave(request.id, 'implemented')}
                              >
                                {t('requests.statusImplemented')}
                              </Button>
                            </div>
                          </div>
                        </section>
                      );
                    })}
                  </div>
                )
              ) : (
                <div className="mx-auto max-w-3xl space-y-5">
                  <div className="rounded-[1.4rem] border border-[hsl(var(--glass-border)/0.08)] bg-[linear-gradient(180deg,hsl(var(--card)/0.58),hsl(var(--card)/0.32))] p-5 shadow-[0_18px_40px_-28px_rgba(0,0,0,0.55)]">
                    <div className="grid gap-5">
                      <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground/75">
                          {t('requests.messageLabel')}
                        </label>
                        <textarea
                          value={message}
                          onChange={(event) => setMessage(event.target.value)}
                          rows={8}
                          className="w-full rounded-2xl glass-input px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/35 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-y"
                          placeholder={t('requests.messagePlaceholder')}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground/75">
                          {t('requests.nameLabel')}
                        </label>
                        <input
                          type="text"
                          value={requesterLabel}
                          onChange={(event) => setRequesterLabel(event.target.value)}
                          className="w-full h-11 rounded-2xl glass-input px-4 text-sm text-foreground placeholder:text-muted-foreground/35 focus:outline-none focus:ring-2 focus:ring-primary/20"
                          placeholder={t('requests.namePlaceholder')}
                          maxLength={120}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-[hsl(var(--glass-border)/0.05)] px-8 py-5">
              <div />
              <div className="flex gap-3">
                <Button type="button" variant="outline" className="rounded-xl" onClick={onClose}>
                  {t('common.close')}
                </Button>
                {!isAdmin ? (
                  <Button
                    type="button"
                    className="rounded-xl"
                    disabled={!clientId || submitState === 'submitting' || message.trim().length < 5}
                    onClick={() => void handleSubmit()}
                  >
                    {submitState === 'submitting' ? t('requests.sending') : t('requests.send')}
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
};