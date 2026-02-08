'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useFormState } from '@/lib/hooks/use-form-state';
import { ErrorMessage } from '@/components/ui/error-message';
import { useLoading } from '@/lib/loading-context';

export default function NewGroupPage() {
  const router = useRouter();
  const { setLoading } = useLoading();
  const { error, isLoading, execute, clearError } = useFormState();
  const [formData, setFormData] = useState({
    name: '',
    time_limit_seconds: 15,
    options_count: 3,
    enable_timer: true,
  });

  useEffect(() => {
    // Reset loading state when page mounts
    setLoading(false);
    // Reset form when component mounts
    setFormData({
      name: '',
      time_limit_seconds: 15,
      options_count: 3,
      enable_timer: true,
    });
    clearError();
  }, [clearError, setLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await execute(async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Not authenticated');
      }

      const { data, error: insertError } = await supabase
        .from('groups')
        .insert({
          name: formData.name,
          creator_id: user.id,
          time_limit_seconds: formData.time_limit_seconds,
          options_count: formData.options_count,
          enable_timer: formData.enable_timer,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      if (data) {
        setFormData({
          name: '',
          time_limit_seconds: 15,
          enable_timer: true,
          options_count: 3,
        });
        router.push(`/admin/groups/${data.id}`);
        router.refresh();
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Group</CardTitle>
        <CardDescription>
          Set up a new group of people for your Guess Who game. Perfect for helping new team members, students, or event
          attendees get to know each other!
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Group Name</Label>
            <Input
              id="name"
              placeholder="e.g., Friends, Family, Coworkers"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              disabled={isLoading}
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              id="enable-timer"
              type="checkbox"
              checked={formData.enable_timer}
              onChange={(e) => setFormData({ ...formData, enable_timer: e.target.checked })}
              className="text-primary focus:ring-primary h-4 w-4 cursor-pointer rounded border-gray-300 focus:ring-2 focus:ring-offset-2"
              disabled={isLoading}
            />
            <Label htmlFor="enable-timer" className="cursor-pointer text-sm leading-none font-medium">
              Enable countdown timer
            </Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="time_limit">Time Limit (seconds per question)</Label>
            <Input
              id="time_limit"
              type="number"
              min="5"
              max="60"
              value={formData.time_limit_seconds}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  time_limit_seconds: parseInt(e.target.value),
                })
              }
              required
              disabled={isLoading}
            />
            <p className="text-muted-foreground text-sm">How long players have to answer each question</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="options_count">Number of Options</Label>
            <Input
              id="options_count"
              type="number"
              min="2"
              max="10"
              value={formData.options_count}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  options_count: parseInt(e.target.value),
                })
              }
              required
              disabled={isLoading}
            />
            <p className="text-muted-foreground text-sm">How many choices to show per question (2-10)</p>
          </div>

          <ErrorMessage message={error} />

          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" loading={isLoading} loadingText="Creating..." className="flex-1">
              Create Group
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
