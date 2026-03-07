import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, Save } from 'lucide-react';
import api from '../../lib/api';
import { Link } from '../../types';
import { useQueryClient } from '@tanstack/react-query';
import { useStore } from '../../store/useStore';
import { IconPicker } from '../ui/IconPicker';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardHeader, CardContent, CardFooter } from '../ui/card';
import { DynamicIcon } from '../ui/DynamicIcon';

interface ManageLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  link?: Link | null;
  initialGroupId?: number | null;
}

export const ManageLinkModal: React.FC<ManageLinkModalProps> = ({ isOpen, onClose, link, initialGroupId }) => {
  const { groups } = useStore();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('');
  const [groupId, setGroupId] = useState<number>(0);
  const [order, setOrder] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (link) {
        setTitle(link.title);
        setUrl(link.url);
        setDescription(link.description || '');
        setIcon(link.icon || '');
        setGroupId(link.group_id);
        setOrder(link.order);
      } else {
        setTitle('');
        setUrl('');
        setDescription('');
        setIcon('');
        setGroupId(initialGroupId || (groups.length > 0 ? groups[0].id : 0));
        setOrder(0);
      }
    }
  }, [isOpen, link, initialGroupId, groups]);



// ... (inside component)

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    // ... (keep existing logic)
    e.preventDefault();
    setIsLoading(true);

    const payload = {
      group_id: groupId,
      title,
      url,
      description,
      icon,
      order
    };

    try {
      if (link) {
         await api.put(`/links/${link.id}`, payload);
      } else {
         await api.post('/links', payload);
      }
      await queryClient.invalidateQueries({ queryKey: ['dashboardData'] });
      onClose();
    } catch (error) {
      console.error('Failed to save link', error);
    } finally {
      setIsLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 text-foreground">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-300"
        onClick={onClose}
      />
      <Card className="w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto flex flex-col relative z-10 rounded-3xl overflow-hidden bg-card/95 border-white/10">
        <CardHeader className="flex flex-row items-center justify-between border-b border-[hsl(var(--glass-border)/0.05)] pb-4">
          <h2 className="text-sm font-black uppercase tracking-[0.2em] text-foreground/90">
            {link ? 'Edit Link' : 'New Link'}
          </h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-[hsl(var(--glass-highlight)/0.05)] rounded-xl transition-colors text-muted-foreground hover:text-foreground active:scale-90"
          >
            <X className="h-5 w-5" />
          </button>
        </CardHeader>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
          <CardContent className="space-y-4 pt-5 flex-1">
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                <label className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] pl-1">Group</label>
                <select
                  className="w-full h-10 px-3 rounded-xl glass-input text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 transition-colors duration-200 bg-background/50 border border-input"
                  value={groupId}
                  onChange={(e) => setGroupId(Number(e.target.value))}
                >
                  {groups.map(g => (
                    <option key={g.id} value={g.id}>{g.title}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] pl-1">Order</label>
                <Input
                  type="number"
                  value={order}
                  onChange={(e) => setOrder(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] pl-1">Title</label>
              <Input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Link Title"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] pl-1">URL</label>
              <Input
                type="url"
                required
                placeholder="https://..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] pl-1">Description (Optional)</label>
              <Input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short description"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] pl-1">Icon</label>
              <div className="flex gap-3 items-center">
                {icon && (
                  <div className="h-10 w-10 rounded-xl glass-surface flex items-center justify-center overflow-hidden">
                    <DynamicIcon icon={icon} className="h-6 w-6" />
                  </div>
                )}
                <Button 
                  type="button"
                  variant="secondary"
                  onClick={() => setShowIconPicker(true)}
                  className="flex-1 rounded-xl"
                >
                  {icon ? 'Change Icon' : 'Select Icon'}
                </Button>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex justify-end gap-3 pt-4 border-t border-[hsl(var(--glass-border)/0.05)] mt-auto">
            <Button
               type="button"
               variant="outline"
               onClick={onClose}
               className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="gap-2 rounded-xl"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              <Save className="h-4 w-4" />
              Save
            </Button>
          </CardFooter>
        </form>
      </Card>

      {showIconPicker && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={() => setShowIconPicker(false)}
          />
          <Card className="w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200 relative z-10 rounded-3xl bg-card border-white/10">
            <CardHeader className="flex flex-row items-center justify-between border-b border-[hsl(var(--glass-border)/0.05)] py-4 px-6">
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-foreground/90">Select Icon</h3>
              <button 
                onClick={() => setShowIconPicker(false)}
                className="p-2 hover:bg-[hsl(var(--glass-highlight)/0.05)] rounded-xl transition-colors text-muted-foreground hover:text-foreground active:scale-90"
              >
                <X className="h-5 w-5" />
              </button>
            </CardHeader>
            <div className="p-0 flex-1 overflow-hidden bg-background">
               <IconPicker 
                 value={icon}
                 onChange={(val) => setIcon(val)}
                 onClose={() => setShowIconPicker(false)}
               />
            </div>
          </Card>
        </div>
      )}
    </div>,
    document.body
  );
};
