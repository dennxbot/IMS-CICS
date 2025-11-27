'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { FileText, Calendar, Send, Loader2 } from "lucide-react";

interface WeeklyReportFormProps {
  studentId: string;
  weekStarting: string;
  weekEnding: string;
}

export function WeeklyReportForm({ studentId, weekStarting, weekEnding }: WeeklyReportFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const [formData, setFormData] = useState({
    tasks_completed: '',
    problems_encountered: '',
    learnings_acquired: '',
    next_week_plan: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/student/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          student_id: studentId,
          week_starting: weekStarting,
          week_ending: weekEnding,
          ...formData
        }),
      });

      if (response.ok) {
        router.push('/student/reports');
        router.refresh();
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to submit report');
      }
    } catch {
      alert('Failed to submit report');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Week Period: {new Date(weekStarting).toLocaleDateString()} - {new Date(weekEnding).toLocaleDateString()}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="tasks_completed" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Tasks Completed This Week
            </Label>
            <Textarea
              id="tasks_completed"
              value={formData.tasks_completed}
              onChange={(e) => handleInputChange('tasks_completed', e.target.value)}
              placeholder="Describe the tasks you completed this week..."
              className="min-h-[100px] mt-2"
              required
            />
          </div>

          <div>
            <Label htmlFor="problems_encountered">
              Problems/Challenges Encountered
            </Label>
            <Textarea
              id="problems_encountered"
              value={formData.problems_encountered}
              onChange={(e) => handleInputChange('problems_encountered', e.target.value)}
              placeholder="Describe any problems or challenges you faced..."
              className="min-h-[100px] mt-2"
            />
          </div>

          <div>
            <Label htmlFor="learnings_acquired">
              Learnings and Skills Acquired
            </Label>
            <Textarea
              id="learnings_acquired"
              value={formData.learnings_acquired}
              onChange={(e) => handleInputChange('learnings_acquired', e.target.value)}
              placeholder="What did you learn this week? What new skills did you develop?"
              className="min-h-[100px] mt-2"
              required
            />
          </div>

          <div>
            <Label htmlFor="next_week_plan">
              Plans for Next Week
            </Label>
            <Textarea
              id="next_week_plan"
              value={formData.next_week_plan}
              onChange={(e) => handleInputChange('next_week_plan', e.target.value)}
              placeholder="What are your goals and plans for next week?"
              className="min-h-[100px] mt-2"
              required
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => window.history.back()}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Submit Report
            </>
          )}
        </Button>
      </div>
    </form>
  );
}