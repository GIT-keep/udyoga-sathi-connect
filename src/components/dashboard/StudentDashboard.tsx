
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
    fetchJobs();
    fetchJobRequests();
  }, []);

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
    console.log('Fetching jobs...');
    const { data, error } = await supabase
      .from('jobs')
      .select(`
        *,
        employer_profiles!inner(business_name),
        job_skills(
          skills(name)
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
    } else {
      console.log('Fetched jobs:', data);
      
      // Filter jobs based on skill matching using AI logic
      const matchedJobs = data?.filter(job => {
        if (studentSkills.length === 0) return true; // Show all jobs if no skills set
        
        const jobSkills = job.job_skills?.map(js => js.skills?.name).filter(Boolean) || [];
        console.log('Job skills for', job.title, ':', jobSkills);
        
        // AI matching: show job if student has at least one matching skill
        const hasMatchingSkill = jobSkills.some(jobSkill => 
          studentSkills.some(studentSkill => 
            studentSkill.toLowerCase().includes(jobSkill.toLowerCase()) ||
            jobSkill.toLowerCase().includes(studentSkill.toLowerCase())
          )
        );
        
        console.log('Job', job.title, 'matches skills:', hasMatchingSkill);
        return hasMatchingSkill || jobSkills.length === 0; // Show jobs with no specific skills too
      }) || [];
      
      console.log('Matched jobs:', matchedJobs);
      setJobs(matchedJobs);
    }
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
      .eq('student_id', user.id);

    if (error) {
      console.error('Error fetching job requests:', error);
    } else {
      console.log('Job requests data:', data);
      setJobRequests(data || []);
    }
  };

  const handleApplyJob = async (jobId: string) => {
    console.log('Applying for job:', jobId);
    const { error } = await supabase
      .from('job_requests')
      .insert({
        job_id: jobId,
        student_id: user.id,
        status: 'pending',
        message: 'I am interested in this position and would like to apply.'
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
        description: "Your application has been sent!"
      });
      fetchJobRequests();
    }
  };

  const renderJobCard = (job: Job) => {
    const jobSkills = job.job_skills?.map(js => js.skills?.name).filter(Boolean) || [];
    const matchingSkills = jobSkills.filter(jobSkill => 
      studentSkills.some(studentSkill => 
        studentSkill.toLowerCase().includes(jobSkill.toLowerCase()) ||
        jobSkill.toLowerCase().includes(studentSkill.toLowerCase())
      )
    );

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
          <p className="text-sm text-gray-600 mb-2">
            <strong>Hours:</strong> {job.hours_of_work}
          </p>
          
          {jobSkills.length > 0 && (
            <div className="mb-3">
              <p className="text-sm font-medium mb-1">Required Skills:</p>
              <div className="flex flex-wrap gap-1">
                {jobSkills.map((skill, index) => (
                  <Badge 
                    key={index} 
                    variant={matchingSkills.includes(skill) ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {skill}
                    {matchingSkills.includes(skill) && " ✓"}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {matchingSkills.length > 0 && (
            <p className="text-sm text-green-600 mb-3">
              🎯 You match {matchingSkills.length} of {jobSkills.length} required skills!
            </p>
          )}
          
          <div className="flex gap-2 flex-wrap">
            <Button 
              onClick={() => handleApplyJob(job.id)}
              size="sm"
            >
              Apply Now
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
              <p className="text-sm mb-2">Message: {request.message}</p>
              <p className="text-xs text-gray-500">
                Applied on: {new Date(request.created_at).toLocaleDateString()}
              </p>
              {request.status === 'accepted' && request.jobs && (
                <div className="mt-3 p-3 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-800 font-medium">🎉 Congratulations! Your application was accepted.</p>
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
            Browse Jobs {studentSkills.length > 0 && `(AI Matched)`}
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
                {studentSkills.length > 0 ? 'Jobs Matching Your Skills' : 'Available Jobs'}
              </h2>
              {studentSkills.length > 0 && (
                <div className="text-sm text-gray-600">
                  Your skills: {studentSkills.join(', ')}
                </div>
              )}
            </div>
            {jobs.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-gray-500">
                    {studentSkills.length > 0 
                      ? "No jobs match your current skills. New opportunities are added regularly!"
                      : "No jobs available at the moment"}
                  </p>
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
