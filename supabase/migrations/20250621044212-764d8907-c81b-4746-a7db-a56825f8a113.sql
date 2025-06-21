
-- Enable RLS on job_requests table
ALTER TABLE public.job_requests ENABLE ROW LEVEL SECURITY;

-- Allow employers to send job requests (INSERT)
CREATE POLICY "Employers can send job requests" 
ON public.job_requests 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.jobs 
    WHERE jobs.id = job_requests.job_id 
    AND jobs.employer_id = auth.uid()
  )
);

-- Allow students to view job requests sent to them (SELECT)
CREATE POLICY "Students can view their job requests" 
ON public.job_requests 
FOR SELECT 
USING (student_id = auth.uid());

-- Allow employers to view job requests for their jobs (SELECT)
CREATE POLICY "Employers can view job requests for their jobs" 
ON public.job_requests 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.jobs 
    WHERE jobs.id = job_requests.job_id 
    AND jobs.employer_id = auth.uid()
  )
);

-- Allow students to update their own job requests (for responding to them)
CREATE POLICY "Students can update their job requests" 
ON public.job_requests 
FOR UPDATE 
USING (student_id = auth.uid());

-- Allow employers to update job requests for their jobs (for accepting/rejecting)
CREATE POLICY "Employers can update job requests for their jobs" 
ON public.job_requests 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.jobs 
    WHERE jobs.id = job_requests.job_id 
    AND jobs.employer_id = auth.uid()
  )
);
