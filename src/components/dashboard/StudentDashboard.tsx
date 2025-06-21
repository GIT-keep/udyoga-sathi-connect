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
  specific_instructions?: string;
  employer_profiles?: {
    business_name: string;
  };
  job_skills?: {
    skills: {
      name: string;
    };
  }[];
}

interface JobRequest {
  id: string;
  job_id: string;
  message: string;
  status: string;
  created_at: string;
  jobs: Job;
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
  const [studentSkills, setStudentSkills] = useState<string[]>([]);

  useEffect(() => {
    fetchStudentSkills();
    fetchJobRequests();
  }, []);

  useEffect(() => {
    if (studentSkills.length > 0) {
      fetchJobs();
    }
  }, [studentSkills]);

  const fetchStudentSkills = async () => {
    console.log('Fetching student skills for user:', user.id);
    const { data, error } = await supabase
      .from('student_skills')
      .select(`
        skills (
          name
        )
      `)
      .eq('student_id', user.id);

    if (error) {
      console.error('Error fetching student skills:', error);
    } else {
      const skills = data?.map(item => item.skills?.name).filter(Boolean) || [];
      console.log('Student skills:', skills);
      setStudentSkills(skills);
    }
  };

  const fetchJobs = async () => {
    if (studentSkills.length === 0) {
      setJobs([]);
      setIsLoading(false);
      return;
    }

    console.log('Fetching jobs with skill matching...');
    const { data, error } = await supabase
      .from('jobs')
      .select(`
        *,
        employer_profiles!inner(business_name),
        job_skills!inner(
          skills!inner(name)
        )
      `)
      .eq('status', 'active');

    if (error) {
      console.error('Error fetching jobs:', error);
      toast({
        title: "Error",
        description: "Failed to fetch jobs",
        variant: "destructive"
      });
      setIsLoading(false);
      return;
    }

    console.log('Raw jobs data:', data);
    
    // Filter jobs to only show those with matching skills
    const matchedJobs = data?.filter(job => {
      const jobSkills = job.job_skills?.map(js => js.skills?.name).filter(Boolean) || [];
      console.log('Job skills for', job.title, ':', jobSkills);
      
      // Show jobs if student has at least one matching skill
      const hasMatchingSkill = jobSkills.some(jobSkill => 
        studentSkills.some(studentSkill => 
          studentSkill.toLowerCase() === jobSkill.toLowerCase()
        )
      );
      
      console.log('Job', job.title, 'matches skills:', hasMatchingSkill);
      return hasMatchingSkill;
    }) || [];
    
    console.log('Final matched jobs:', matchedJobs);
    setJobs(matchedJobs);
    setIsLoading(false);
  };

  const fetchJobRequests = async () => {
    console.log('Fetching job requests...');
    const { data, error } = await supabase
      .from('job_requests')
      .select(`
        *,
        jobs(
          *,
          employer_profiles(business_name)
        )
      `)
      .eq('student_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching job requests:', error);
    } else {
      console.log('Job requests data:', data);
      setJobRequests(data || []);
    }
  };

  const handleApplyJob = async (jobId: string) => {
    console.log('Applying for job:', jobId);
    
    // Check if already applied
    const existingRequest = jobRequests.find(req => req.job_id === jobId);
    if (existingRequest) {
      toast({
        title: "Info",
        description: "You have already applied for this job",
        variant: "default"
      });
      return;
    }

    const { error } = await supabase
      .from('job_requests')
      .insert({
        job_id: jobId,
        student_id: user.id,
        status: 'pending',
        message: 'I am interested in this position and would like to apply. I believe my skills match the job requirements.'
      });

    if (error) {
      console.error('Error applying for job:', error);
      toast({
        title: "Error",
        description: "Failed to apply for job",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Success",
        description: "Your application has been sent! Check your inbox for updates."
      });
      fetchJobRequests();
    }
  };

  const handleAcceptJobRequest = async (requestId: string) => {
    const { error } = await supabase
      .from('job_requests')
      .update({ status: 'accepted' })
      .eq('id', requestId);

    if (error) {
      console.error('Error accepting job request:', error);
      toast({
        title: "Error",
        description: "Failed to accept job request",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Success",
        description: "Job request accepted! The recruiter will be notified."
      });
      fetchJobRequests();
    }
  };

  const handleRejectJobRequest = async (requestId: string) => {
    const { error } = await supabase
      .from('job_requests')
      .update({ status: 'rejected' })
      .eq('id', requestId);

    if (error) {
      console.error('Error rejecting job request:', error);
      toast({
        title: "Error",
        description: "Failed to reject job request",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Success",
        description: "Job request rejected."
      });
      fetchJobRequests();
    }
  };

  const renderJobCard = (job: Job) => {
    const hasApplied = jobRequests.some(req => req.job_id === job.id);

    return (
      <Card key={job.id} className="mb-4">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg">{job.title}</CardTitle>
              <p className="text-sm text-gray-600">{job.employer_profiles?.business_name}</p>
            </div>
            <Badge variant="outline">
              ₹{job.pay_rate}/{job.pay_type.replace('per_', '')}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm mb-2">{job.description}</p>
          {job.specific_instructions && (
            <p className="text-sm mb-2 text-blue-600">
              <strong>Instructions:</strong> {job.specific_instructions}
            </p>
          )}
          <p className="text-sm text-gray-600 mb-3">
            <strong>Hours:</strong> {job.hours_of_work}
          </p>
          
          <p className="text-sm text-green-600 mb-3">
            ✅ Your skills match this job's requirements!
          </p>
          
          <div className="flex gap-2 flex-wrap">
            <Button 
              onClick={() => handleApplyJob(job.id)}
              size="sm"
              disabled={hasApplied}
              variant={hasApplied ? "secondary" : "default"}
            >
              {hasApplied ? "Applied" : "Apply Now"}
            </Button>
            {job.whatsapp_number && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open(`https://wa.me/${job.whatsapp_number.replace(/[^0-9]/g, '')}`, '_blank')}
              >
                WhatsApp: {job.whatsapp_number}
              </Button>
            )}
            {job.contact_email && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open(`mailto:${job.contact_email}`, '_blank')}
              >
                Email
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

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
                <div>
                  <CardTitle className="text-lg">{request.jobs?.title}</CardTitle>
                  <p className="text-sm text-gray-600">{request.jobs?.employer_profiles?.business_name}</p>
                </div>
                <Badge 
                  variant={request.status === 'accepted' ? 'default' : 
                          request.status === 'rejected' ? 'destructive' : 'secondary'}
                >
                  {request.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-2"><strong>Message:</strong> {request.message}</p>
              <p className="text-xs text-gray-500 mb-3">
                Received on: {new Date(request.created_at).toLocaleDateString()}
              </p>
              
              {request.status === 'pending' && (
                <div className="flex gap-2 mb-3">
                  <Button 
                    onClick={() => handleAcceptJobRequest(request.id)}
                    size="sm"
                    variant="default"
                  >
                    Accept Job Request
                  </Button>
                  <Button 
                    onClick={() => handleRejectJobRequest(request.id)}
                    size="sm"
                    variant="destructive"
                  >
                    Reject
                  </Button>
                </div>
              )}
              
              {request.status === 'accepted' && request.jobs && (
                <div className="mt-3 p-3 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-800 font-medium">🎉 You accepted this job request!</p>
                  <div className="flex gap-2 mt-2">
                    {request.jobs.whatsapp_number && (
                      <Button 
                        size="sm" 
                        onClick={() => window.open(`https://wa.me/${request.jobs.whatsapp_number.replace(/[^0-9]/g, '')}`, '_blank')}
                      >
                        Contact via WhatsApp
                      </Button>
                    )}
                    {request.jobs.contact_email && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => window.open(`mailto:${request.jobs.contact_email}`, '_blank')}
                      >
                        Send Email
                      </Button>
                    )}
                  </div>
                </div>
              )}
              
              {request.status === 'rejected' && (
                <div className="mt-3 p-3 bg-red-50 rounded-lg">
                  <p className="text-sm text-red-800">You rejected this job request.</p>
                </div>
              )}
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
            Browse Jobs {studentSkills.length > 0 && `(Matched)`}
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
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">
                {studentSkills.length > 0 ? 'Jobs Matching Your Skills' : 'Set up your skills to see matching jobs'}
              </h2>
            </div>
            {studentSkills.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-gray-500">
                    Please set up your skills in your profile to see matching job opportunities.
                  </p>
                </CardContent>
              </Card>
            ) : jobs.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-gray-500">
                    No jobs match your current skills. New opportunities are added regularly!
                  </p>
                </CardContent>
              </Card>
            ) : (
              jobs.map(renderJobCard)
            )}
          </div>
        ) : (
          <div>
            <h2 className="text-2xl font-bold mb-6">Your Job Requests</h2>
            {renderInbox()}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
