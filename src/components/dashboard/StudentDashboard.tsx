
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { User } from '@supabase/supabase-js';

interface Job {
  id: string;
  title: string;
  description: string;
  pay_rate: number;
  pay_type: string;
  hours_of_work: string;
  contact_email: string;
  whatsapp_number: string;
  employer_id: string;
  employer_profile?: {
    business_name: string;
  };
}

interface JobRequest {
  id: string;
  job_id: string;
  message: string;
  status: string;
  created_at: string;
  job: Job;
}

interface StudentDashboardProps {
  user: User;
  onSignOut: () => void;
}

const StudentDashboard: React.FC<StudentDashboardProps> = ({ user, onSignOut }) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobRequests, setJobRequests] = useState<JobRequest[]>([]);
  const [activeTab, setActiveTab] = useState<'browse' | 'inbox'>('browse');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchJobs();
    fetchJobRequests();
  }, []);

  const fetchJobs = async () => {
    const { data, error } = await supabase
      .from('jobs')
      .select(`
        *,
        employer_profiles!inner(business_name)
      `)
      .eq('status', 'active');

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch jobs",
        variant: "destructive"
      });
    } else {
      setJobs(data || []);
    }
    setIsLoading(false);
  };

  const fetchJobRequests = async () => {
    const { data, error } = await supabase
      .from('job_requests')
      .select(`
        *,
        jobs(*)
      `)
      .eq('student_id', user.id);

    if (error) {
      console.error('Error fetching job requests:', error);
    } else {
      setJobRequests(data || []);
    }
  };

  const handleApplyJob = async (jobId: string) => {
    const { error } = await supabase
      .from('job_requests')
      .insert({
        job_id: jobId,
        student_id: user.id,
        status: 'pending',
        message: 'I am interested in this position and would like to apply.'
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to apply for job",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Success",
        description: "Your application has been sent!"
      });
      fetchJobRequests();
    }
  };

  const renderJobCard = (job: Job) => (
    <Card key={job.id} className="mb-4">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{job.title}</CardTitle>
            <p className="text-sm text-gray-600">{job.employer_profile?.business_name}</p>
          </div>
          <Badge variant="outline">
            ₹{job.pay_rate}/{job.pay_type}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm mb-2">{job.description}</p>
        <p className="text-sm text-gray-600 mb-4">
          <strong>Hours:</strong> {job.hours_of_work}
        </p>
        <div className="flex gap-2">
          <Button 
            onClick={() => handleApplyJob(job.id)}
            size="sm"
          >
            Apply Now
          </Button>
          <Button variant="outline" size="sm">
            Contact: {job.whatsapp_number}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderInbox = () => (
    <div className="space-y-4">
      {jobRequests.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">No job requests yet</p>
          </CardContent>
        </Card>
      ) : (
        jobRequests.map((request) => (
          <Card key={request.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{request.job.title}</CardTitle>
                <Badge 
                  variant={request.status === 'accepted' ? 'default' : 
                          request.status === 'rejected' ? 'destructive' : 'secondary'}
                >
                  {request.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-2">Message: {request.message}</p>
              <p className="text-xs text-gray-500">
                Applied on: {new Date(request.created_at).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600 mb-4">🤝 Udyoga Mitra</div>
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="text-2xl font-bold text-blue-600">🤝</div>
              <h1 className="text-xl font-bold ml-2 text-blue-600">Udyoga Mitra</h1>
            </div>
            <Button variant="outline" onClick={onSignOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-4 mb-6">
          <Button 
            variant={activeTab === 'browse' ? 'default' : 'outline'}
            onClick={() => setActiveTab('browse')}
          >
            Browse Jobs
          </Button>
          <Button 
            variant={activeTab === 'inbox' ? 'default' : 'outline'}
            onClick={() => setActiveTab('inbox')}
          >
            Inbox ({jobRequests.length})
          </Button>
        </div>

        {activeTab === 'browse' ? (
          <div>
            <h2 className="text-2xl font-bold mb-6">Available Jobs</h2>
            {jobs.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-gray-500">No jobs available at the moment</p>
                </CardContent>
              </Card>
            ) : (
              jobs.map(renderJobCard)
            )}
          </div>
        ) : (
          <div>
            <h2 className="text-2xl font-bold mb-6">Your Applications</h2>
            {renderInbox()}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
