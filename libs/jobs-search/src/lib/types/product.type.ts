export interface JobPosting {
  job_type: string;
  first_seen: string;
  job_link: string;
  got_summary: boolean;
  is_being_worked: boolean;
  search_country: string;
  search_position: string;
  got_ner: boolean;
  '@timestamp': string;
  search_city: string;
  last_processed_time: string;
  company: string;
  job_level: string;
  job_title: string;
  job_location: string;
}
