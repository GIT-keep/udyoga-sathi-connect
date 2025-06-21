
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { User } from '@supabase/supabase-js';
import { Trash2 } from 'lucide-react';

const SKILLS_LIST = [
  'Data Entry', 'Customer Service', 'Content Writing', 'Graphic Design',
  'Social Media Management', 'Event Management', 'Video Editing', 'Photography',
  'Sales', 'Tutoring', 'Survey Taking', 'Delivery Services', 'Reception Work',
  'Email Marketing', 'Coding (Web Development)', 'Digital Marketing', 'Blogging',
  'Technical Support', 'Typing', 'MS Office (Excel, Word, PowerPoint)',
  'Retail Assistance', 'Market Research', 'Influencer Collaboration',
  'Transcription', 'Public Speaking', 'Script Writing', 'Voice-over',
  'Virtual Assistance', 'Cooking or Catering Support', 'Cleaning & Maintenance'
];

interface Job {
  id: string;
  title: string;
  description: string;
  pay_rate: number;
  pay_type: string;
  hours_of_work: string;
  contact_email: string;
  whatsapp_number: string;
  status: string;
  created_at: string;
}

interface Student {
  student_id: string;
  full_name: string;
  phone_number: string;
  matching_skills_count: number;
}

interface JobRequest {
  id: string;
  job_id: string;
  student_id: string;
  message: string;
  status: string;
  created_at: string;
  profiles: {
    full_name: string;
    phone_number: string;
  };
  jobs: {
    title: string;
  };
}

interface EmployerDashboardProps {
  user: User;
  onSignOut: () => void;
}

const EmployerDashboard: React.FC<EmployerDashboardProps> = ({ user, onSignOut }) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [matchingStudents, setMatchingStudents] = useState<Student[]>([]);
  const [jobRequests, setJobRequests] = useState<JobRequest[]>([]);
  const [activeTab, setActiveTab] = useState<'jobs' | 'candidates' | 'requests'>('jobs');
  const [isLoading, setIsLoading] = useState(true);
  const [showJobDialog, setShowJobDialog] = useState(false);
  const [selectedJobForCandidates, setSelectedJobForCandidates] = useState<string | null>(null);
  
  const [jobForm, setJobForm] = useState({
    title: '',
    description: '',
    hoursOfWork: '',
    payRate: '',
    payType: 'per_hour' as 'per_hour' | 'per_day',
    specificInstructions: '',
    contactEmail: '',
    whatsappNumber: '',
    selectedSkills: [] as string[]
  });

  useEffect(() => {
    fetchJobs();
    fetchJobRequests();
  }, []);

  const fetchJobs = async () => {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('employer_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching jobs:', error);
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
    // First get all jobs for this employer
    const { data: employerJobs } = await supabase
      .from('jobs')
      .select('id')
      .eq('employer_id', user.id);

    if (!employerJobs || employerJobs.length === 0) {
      setJobRequests([]);
      return;
    }

    const jobIds = employerJobs.map(job => job.id);

    const { data, error } = await supabase
      .from('job_requests')
      .select(`
        *,
        profiles!inner(full_name, phone_number),
        jobs!inner(title)
      `)
      .in('job_id', jobIds)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching job requests:', error);
    } else {
      // Transform the data to match our interface
      const transformedData = data?.map(request => ({
        ...request,
        profiles: Array.isArray(request.profiles) ? request.profiles[0] : request.profiles,
        jobs: Array.isArray(request.jobs) ? request.jobs[0] : request.jobs
      })) || [];
      setJobRequests(transformedData);
    }
  };

  const fetchMatchingStudents = async (jobId: string) => {
    const { data, error } = await supabase
      .rpc('get_matching_students', { job_uuid: jobId });

    if (error) {
      console.error('Error fetching matching students:', error);
      toast({
        title: "Error",
        description: "Failed to fetch matching students",
        variant: "destructive"
      });
    } else {
      setMatchingStudents(data || []);
      setSelectedJobForCandidates(jobId);
      setActiveTab('candidates');
    }
  };

  const handleJobSubmit = async () => {
    if (!jobForm.title || !jobForm.description || !jobForm.payRate) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const { data: jobData, error: jobError } = await supabase
      .from('jobs')
      .insert({
        employer_id: user.id,
        title: jobForm.title,
        description: jobForm.description,
        hours_of_work: jobForm.hoursOfWork,
        pay_rate: parseFloat(jobForm.payRate),
        pay_type: jobForm.payType,
        specific_instructions: jobForm.specificInstructions,
        contact_email: jobForm.contactEmail,
        whatsapp_number: jobForm.whatsappNumber,
        status: 'active'
      })
      .select()
      .single();

    if (jobError) {
      console.error('Job creation error:', jobError);
      toast({
        title: "Error",
        description: "Failed to create job",
        variant: "destructive"
      });
      return;
    }

    // Add skills to job
    if (jobForm.selectedSkills.length > 0) {
      const { data: skillsData } = await supabase
        .from('skills')
        .select('id, name')
        .in('name', jobForm.selectedSkills);

      if (skillsData) {
        const jobSkills = skillsData.map(skill => ({
          job_id: jobData.id,
          skill_id: skill.id
        }));

        await supabase
          .from('job_skills')
          .insert(jobSkills);
      }
    }

    toast({
      title: "Success",
      description: "Job posted successfully!"
    });

    setShowJobDialog(false);
    setJobForm({
      title: '',
      description: '',
      hoursOfWork: '',
      payRate: '',
      payType: 'per_hour',
      specificInstructions: '',
      contactEmail: '',
      whatsappNumber: '',
      selectedSkills: []
    });
    fetchJobs();
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this job? This action cannot be undone.')) {
      return;
    }

    // First delete related job_skills
    await supabase
      .from('job_skills')
      .delete()
      .eq('job_id', jobId);

    // Then delete the job
    const { error } = await supabase
      .from('jobs')
      .delete()
      .eq('id', jobId)
      .eq('employer_id', user.id);

    if (error) {
      console.error('Error deleting job:', error);
      toast({
        title: "Error",
        description: "Failed to delete job",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Success",
        description: "Job deleted successfully"
      });
      fetchJobs();
    }
  };

  const handleSkillToggle = (skill: string) => {
    setJobForm(prev => ({
      ...prev,
      selectedSkills: prev.selectedSkills.includes(skill)
        ? prev.selectedSkills.filter(s => s !== skill)
        : [...prev.selectedSkills, skill]
    }));
  };

  const sendJobRequest = async (studentId: string) => {
    if (!selectedJobForCandidates) {
      toast({
        title: "Error",
        description: "No job selected",
        variant: "destructive"
      });
      return;
    }

    // Check if request already exists
    const { data: existingRequest } = await supabase
      .from('job_requests')
      .select('id')
      .eq('job_id', selectedJobForCandidates)
      .eq('student_id', studentId)
      .single();

    if (existingRequest) {
      toast({
        title: "Info",
        description: "Job request already sent to this student",
        variant: "default"
      });
      return;
    }

    const { error } = await supabase
      .from('job_requests')
      .insert({
        job_id: selectedJobForCandidates,
        student_id: studentId,
        status: 'pending',
        message: 'We would like to offer you this position based on your skills match.'
      });

    if (error) {
      console.error('Error sending job request:', error);
      toast({
        title: "Error",
        description: "Failed to send job request",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Success",
        description: "Job request sent to student!"
      });
      fetchJobRequests();
    }
  };

  const handleRequestResponse = async (requestId: string, status: 'accepted' | 'rejected') => {
    const { error } = await supabase
      .from('job_requests')
      .update({ status })
      .eq('id', requestId);

    if (error) {
      console.error('Error updating request:', error);
      toast({
        title: "Error",
        description: "Failed to update request",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Success",
        description: `Request ${status} successfully`
      });
      fetchJobRequests();
    }
  };

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
              <h1 className="text-xl font-bold ml-2 text-blue-600">Udyoga Mitra - Recruiter</h1>
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
            variant={activeTab === 'jobs' ? 'default' : 'outline'}
            onClick={() => setActiveTab('jobs')}
          >
            My Jobs ({jobs.length})
          </Button>
          <Button 
            variant={activeTab === 'requests' ? 'default' : 'outline'}
            onClick={() => setActiveTab('requests')}
          >
            Applications ({jobRequests.length})
          </Button>
          <Button 
            variant={activeTab === 'candidates' ? 'default' : 'outline'}
            onClick={() => setActiveTab('candidates')}
            disabled={!selectedJobForCandidates}
          >
            Candidates ({matchingStudents.length})
          </Button>
          <Dialog open={showJobDialog} onOpenChange={setShowJobDialog}>
            <DialogTrigger asChild>
              <Button>Post New Job</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Post a New Job</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Job Title *</Label>
                  <Input
                    id="title"
                    value={jobForm.title}
                    onChange={(e) => setJobForm(prev => ({ ...prev, title: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Job Description *</Label>
                  <Textarea
                    id="description"
                    value={jobForm.description}
                    onChange={(e) => setJobForm(prev => ({ ...prev, description: e.target.value }))}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="payRate">Pay Rate *</Label>
                    <Input
                      id="payRate"
                      type="number"
                      value={jobForm.payRate}
                      onChange={(e) => setJobForm(prev => ({ ...prev, payRate: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="payType">Pay Type</Label>
                    <Select value={jobForm.payType} onValueChange={(value: 'per_hour' | 'per_day') => setJobForm(prev => ({ ...prev, payType: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="per_hour">Per Hour</SelectItem>
                        <SelectItem value="per_day">Per Day</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="hoursOfWork">Hours of Work</Label>
                  <Input
                    id="hoursOfWork"
                    placeholder="e.g., Mon-Fri 9AM-5PM"
                    value={jobForm.hoursOfWork}
                    onChange={(e) => setJobForm(prev => ({ ...prev, hoursOfWork: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contactEmail">Contact Email</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      value={jobForm.contactEmail}
                      onChange={(e) => setJobForm(prev => ({ ...prev, contactEmail: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="whatsappNumber">WhatsApp Number</Label>
                    <Input
                      id="whatsappNumber"
                      value={jobForm.whatsappNumber}
                      onChange={(e) => setJobForm(prev => ({ ...prev, whatsappNumber: e.target.value }))}
                    />
                  </div>
                </div>
                <div>
                  <Label>Required Skills</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto mt-2 p-2 border rounded">
                    {SKILLS_LIST.map((skill) => (
                      <div key={skill} className="flex items-center space-x-2">
                        <Checkbox
                          id={`job-${skill}`}
                          checked={jobForm.selectedSkills.includes(skill)}
                          onCheckedChange={() => handleSkillToggle(skill)}
                        />
                        <Label htmlFor={`job-${skill}`} className="text-sm cursor-pointer">
                          {skill}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <Label htmlFor="specificInstructions">Specific Instructions</Label>
                  <Textarea
                    id="specificInstructions"
                    value={jobForm.specificInstructions}
                    onChange={(e) => setJobForm(prev => ({ ...prev, specificInstructions: e.target.value }))}
                  />
                </div>
                <Button onClick={handleJobSubmit} className="w-full">
                  Post Job
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {activeTab === 'jobs' ? (
          <div>
            <h2 className="text-2xl font-bold mb-6">Your Job Listings</h2>
            {jobs.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-gray-500">No jobs posted yet</p>
                  <Button className="mt-4" onClick={() => setShowJobDialog(true)}>
                    Post Your First Job
                  </Button>
                </CardContent>
              </Card>
            ) : (
              jobs.map((job) => (
                <Card key={job.id} className="mb-4">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{job.title}</CardTitle>
                      <div className="flex gap-2">
                        <Badge variant="outline">
                          ₹{job.pay_rate}/{job.pay_type === 'per_hour' ? 'hour' : 'day'}
                        </Badge>
                        <Badge variant={job.status === 'active' ? 'default' : 'secondary'}>
                          {job.status}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-4">{job.description}</p>
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => fetchMatchingStudents(job.id)}
                        size="sm"
                      >
                        View Matching Candidates
                      </Button>
                      <Button 
                        onClick={() => handleDeleteJob(job.id)}
                        size="sm"
                        variant="destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete Job
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        ) : activeTab === 'requests' ? (
          <div>
            <h2 className="text-2xl font-bold mb-6">Job Applications</h2>
            {jobRequests.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-gray-500">No applications received yet</p>
                </CardContent>
              </Card>
            ) : (
              jobRequests.map((request) => (
                <Card key={request.id} className="mb-4">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold">{request.profiles.full_name}</h3>
                        <p className="text-sm text-gray-600">Phone: {request.profiles.phone_number}</p>
                        <p className="text-sm text-gray-600">Job: {request.jobs.title}</p>
                        <p className="text-sm text-gray-600 mt-1">Applied on: {new Date(request.created_at).toLocaleDateString()}</p>
                        <p className="text-sm mt-2"><strong>Message:</strong> {request.message}</p>
                        <Badge 
                          variant={request.status === 'accepted' ? 'default' : 
                                  request.status === 'rejected' ? 'destructive' : 'secondary'}
                          className="mt-2"
                        >
                          {request.status}
                        </Badge>
                      </div>
                      {request.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button 
                            onClick={() => handleRequestResponse(request.id, 'accepted')}
                            size="sm"
                          >
                            Accept
                          </Button>
                          <Button 
                            onClick={() => handleRequestResponse(request.id, 'rejected')}
                            size="sm"
                            variant="destructive"
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        ) : (
          <div>
            <h2 className="text-2xl font-bold mb-6">Matching Candidates</h2>
            {matchingStudents.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-gray-500">No matching candidates found</p>
                </CardContent>
              </Card>
            ) : (
              matchingStudents.map((student) => (
                <Card key={student.student_id} className="mb-4">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{student.full_name}</h3>
                        <p className="text-sm text-gray-600">Phone: {student.phone_number}</p>
                        <Badge variant="outline" className="mt-2">
                          {student.matching_skills_count} matching skills
                        </Badge>
                      </div>
                      <Button 
                        onClick={() => sendJobRequest(student.student_id)}
                        size="sm"
                      >
                        Send Job Request
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployerDashboard;
