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
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: '',
    age: '',
    phoneNumber: '',
    aadhaarCard: '',
    address: '',
    collegeId: '',
    jobAvailabilityHours: '',
    businessName: '',
    businessAddress: '',
    jobTypeProvided: '',
    selectedSkills: [] as string[]
  });

  const totalSteps = userType === 'student' ? 3 : 2;
  const progress = (currentStep / totalSteps) * 100;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSkillToggle = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      selectedSkills: prev.selectedSkills.includes(skill) 
        ? prev.selectedSkills.filter(s => s !== skill)
        : [...prev.selectedSkills, skill]
    }));
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
    setIsSubmitting(true);
    
    try {
      // First create the main profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          full_name: formData.fullName,
          age: parseInt(formData.age),
          phone_number: formData.phoneNumber,
          aadhaar_card: formData.aadhaarCard,
          user_type: userType as 'student' | 'employer'
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        throw profileError;
      }

      if (userType === 'student') {
        // Create student profile
        const { error: studentError } = await supabase
          .from('student_profiles')
          .insert({
            id: user.id,
            address: formData.address,
            college_id: formData.collegeId,
            job_availability_hours: formData.jobAvailabilityHours
          });

        if (studentError) {
          console.error('Student profile creation error:', studentError);
          throw studentError;
        }

        // Add skills
        if (formData.selectedSkills.length > 0) {
          const { data: skillsData } = await supabase
            .from('skills')
            .select('id, name')
            .in('name', formData.selectedSkills);

          if (skillsData) {
            const studentSkills = skillsData.map(skill => ({
              student_id: user.id,
              skill_id: skill.id
            }));

            const { error: skillsError } = await supabase
              .from('student_skills')
              .insert(studentSkills);

            if (skillsError) {
              console.error('Skills creation error:', skillsError);
              throw skillsError;
            }
          }
        }
      } else {
        // Create employer profile
        const { error: employerError } = await supabase
          .from('employer_profiles')
          .insert({
            id: user.id,
            business_name: formData.businessName,
            business_address: formData.businessAddress,
            job_type_provided: formData.jobTypeProvided
          });

        if (employerError) {
          console.error('Employer profile creation error:', employerError);
          throw employerError;
        }
      }

      toast({
        title: "Success",
        description: "Profile created successfully!"
      });
      
      onComplete();
    } catch (error) {
      console.error('Error creating profile:', error);
      toast({
        title: "Error",
        description: "Failed to create profile. Please try again.",
        variant: "destructive"
      });
    }
    
    setIsSubmitting(false);
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
                  value={formData.fullName}
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
                  value={formData.age}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="phoneNumber">Phone Number *</Label>
                <Input
                  id="phoneNumber"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="aadhaarCard">Aadhaar Card *</Label>
                <Input
                  id="aadhaarCard"
                  name="aadhaarCard"
                  value={formData.aadhaarCard}
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
                  value={formData.address}
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
                    value={formData.collegeId}
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
                    value={formData.jobAvailabilityHours}
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
                  value={formData.businessName}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="businessAddress">Business Address *</Label>
                <Textarea
                  id="businessAddress"
                  name="businessAddress"
                  value={formData.businessAddress}
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
                  value={formData.jobTypeProvided}
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
                    checked={formData.selectedSkills.includes(skill)}
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
              Selected: {formData.selectedSkills.length} skills
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
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? "Creating Profile..." : "Complete Setup"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileSetup;
