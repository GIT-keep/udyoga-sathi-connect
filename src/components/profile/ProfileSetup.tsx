
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { User } from '@supabase/supabase-js';

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

interface ProfileSetupProps {
  user: User;
  userType: string;
  onComplete: () => void;
}

const ProfileSetup: React.FC<ProfileSetupProps> = ({ user, userType, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  
  const [profileData, setProfileData] = useState({
    fullName: '',
    age: '',
    phoneNumber: '',
    aadhaarCard: '',
    // Student specific
    address: '',
    collegeId: '',
    jobAvailabilityHours: '',
    // Employer specific
    businessName: '',
    businessAddress: '',
    jobTypeProvided: ''
  });

  const totalSteps = userType === 'student' ? 3 : 2;
  const progress = (currentStep / totalSteps) * 100;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setProfileData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSkillToggle = (skill: string) => {
    setSelectedSkills(prev => 
      prev.includes(skill) 
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    );
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);

    try {
      // Insert into profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          full_name: profileData.fullName,
          age: parseInt(profileData.age),
          phone_number: profileData.phoneNumber,
          aadhaar_card: profileData.aadhaarCard,
          user_type: userType
        });

      if (profileError) throw profileError;

      if (userType === 'student') {
        // Insert into student_profiles table
        const { error: studentError } = await supabase
          .from('student_profiles')
          .insert({
            id: user.id,
            address: profileData.address,
            college_id: profileData.collegeId,
            job_availability_hours: profileData.jobAvailabilityHours
          });

        if (studentError) throw studentError;

        // Insert selected skills
        if (selectedSkills.length > 0) {
          // First get skill IDs
          const { data: skillsData, error: skillsError } = await supabase
            .from('skills')
            .select('id, name')
            .in('name', selectedSkills);

          if (skillsError) throw skillsError;

          if (skillsData) {
            const studentSkills = skillsData.map(skill => ({
              student_id: user.id,
              skill_id: skill.id
            }));

            const { error: studentSkillsError } = await supabase
              .from('student_skills')
              .insert(studentSkills);

            if (studentSkillsError) throw studentSkillsError;
          }
        }
      } else {
        // Insert into employer_profiles table
        const { error: employerError } = await supabase
          .from('employer_profiles')
          .insert({
            id: user.id,
            business_name: profileData.businessName,
            business_address: profileData.businessAddress,
            job_type_provided: profileData.jobTypeProvided
          });

        if (employerError) throw employerError;
      }

      toast({
        title: "Profile Created Successfully!",
        description: "Welcome to Udyoga Mitra"
      });

      onComplete();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }

    setIsLoading(false);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  value={profileData.fullName}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="age">Age *</Label>
                <Input
                  id="age"
                  name="age"
                  type="number"
                  value={profileData.age}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="phoneNumber">Phone Number *</Label>
                <Input
                  id="phoneNumber"
                  name="phoneNumber"
                  value={profileData.phoneNumber}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="aadhaarCard">Aadhaar Card *</Label>
                <Input
                  id="aadhaarCard"
                  name="aadhaarCard"
                  value={profileData.aadhaarCard}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
          </div>
        );

      case 2:
        if (userType === 'student') {
          return (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Student Details</h3>
              <div>
                <Label htmlFor="address">Address *</Label>
                <Textarea
                  id="address"
                  name="address"
                  value={profileData.address}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="collegeId">College ID *</Label>
                  <Input
                    id="collegeId"
                    name="collegeId"
                    value={profileData.collegeId}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="jobAvailabilityHours">Job Availability Hours *</Label>
                  <Input
                    id="jobAvailabilityHours"
                    name="jobAvailabilityHours"
                    placeholder="e.g., Mon-Fri 6-10 PM"
                    value={profileData.jobAvailabilityHours}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
            </div>
          );
        } else {
          return (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Business Details</h3>
              <div>
                <Label htmlFor="businessName">Business Name *</Label>
                <Input
                  id="businessName"
                  name="businessName"
                  value={profileData.businessName}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="businessAddress">Business Address *</Label>
                <Textarea
                  id="businessAddress"
                  name="businessAddress"
                  value={profileData.businessAddress}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="jobTypeProvided">Type of Job Provided *</Label>
                <Input
                  id="jobTypeProvided"
                  name="jobTypeProvided"
                  placeholder="e.g., Data Entry, Customer Service"
                  value={profileData.jobTypeProvided}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
          );
        }

      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Select Your Skills</h3>
            <p className="text-sm text-gray-600">Choose skills that match your abilities</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
              {SKILLS_LIST.map((skill) => (
                <div key={skill} className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50">
                  <Checkbox
                    id={skill}
                    checked={selectedSkills.includes(skill)}
                    onCheckedChange={() => handleSkillToggle(skill)}
                  />
                  <Label 
                    htmlFor={skill} 
                    className="text-sm cursor-pointer flex-1 leading-tight"
                  >
                    {skill}
                  </Label>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500">
              Selected: {selectedSkills.length} skills
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-orange-50 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="text-2xl font-bold text-blue-600">🤝</div>
            <h1 className="text-2xl font-bold ml-2 text-blue-600">Udyoga Mitra</h1>
          </div>
          <CardTitle>Complete Your Profile</CardTitle>
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Step {currentStep} of {totalSteps}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        </CardHeader>
        <CardContent>
          {renderStep()}
          
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1}
            >
              Back
            </Button>
            
            {currentStep < totalSteps ? (
              <Button onClick={handleNext}>
                Next
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={isLoading}>
                {isLoading ? "Creating Profile..." : "Complete Setup"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileSetup;
