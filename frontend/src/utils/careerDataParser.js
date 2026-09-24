/**
 * Career data parsing utilities for SkillSense
 * Accurately extracts educational pathways, fee structures, income estimates,
 * personality traits, and career progression from raw database records.
 */

export function parseEducationPath(careerData) {
  if (!careerData) return '10+2 \u2192 Degree Course';
  const edu = careerData.educational_pathway;
  if (!edu) return '10+2 \u2192 Degree Course';

  const steps = Array.isArray(edu) ? edu : (Array.isArray(edu?.steps) ? edu.steps : []);
  if (steps.length > 0) {
    let s1 = '';
    let s2 = '';
    for (const step of steps) {
      const text = step?.details || (typeof step === 'string' ? step : '');
      if (!text) continue;
      
      // Step 1: 10+2 qualification
      if (text.includes('10+2') && !s1) {
        const tl = text.toLowerCase();
        if (tl.includes('physics') || tl.includes('science') || tl.includes('math')) {
          s1 = '10+2 (Science / PCM)';
        } else if (tl.includes('biology') || tl.includes('pcb')) {
          s1 = '10+2 (Science / PCB)';
        } else if (tl.includes('commerce')) {
          s1 = '10+2 (Commerce)';
        } else if (tl.includes('any stream')) {
          s1 = '10+2 (Any Stream)';
        } else {
          s1 = '10+2 Standard';
        }
      }

      // Step 2: Bachelor degree / diploma
      if ((text.includes('Bachelor') || text.includes('Degree') || text.includes('B.E') || text.includes('B.Tech') || text.includes('Diploma')) && !s2) {
        const parenMatch = text.match(/\(([^)]+)\)/);
        if (parenMatch) {
          s2 = parenMatch[1].split('/')[0].trim();
        } else if (text.toLowerCase().includes('bachelor')) {
          s2 = "Bachelor's Degree";
        } else if (text.toLowerCase().includes('diploma')) {
          s2 = 'Diploma Course';
        }
      }
    }

    if (s1 && s2) return `${s1} \u2192 ${s2}`;
    if (s2) return s2;
    if (s1) return s1;
    if (steps[0]?.details) return steps[0].details.slice(0, 48);
  }

  if (typeof edu === 'string') return edu;
  return '10+2 \u2192 Relevant Degree';
}

export function parseStreamInfo(careerData) {
  if (!careerData) return 'Academic Stream';
  const name = (careerData.career_name || careerData.name || '').toLowerCase();
  const edu = careerData.educational_pathway;
  const steps = Array.isArray(edu) ? edu : (Array.isArray(edu?.steps) ? edu.steps : []);
  const allText = (name + ' ' + steps.map(s => s?.details || '').join(' ') + ' ' + (careerData.description || '')).toLowerCase();

  // Career title priority matching
  if (name.includes('smart manufacturing') || name.includes('automation') || name.includes('robotics')) {
    return 'Robotics & Automation';
  } else if (name.includes('metallurg')) {
    return 'Metallurgical Engineering';
  } else if (name.includes('mining')) {
    return 'Mining Engineering';
  } else if (name.includes('process')) {
    return 'Process & Chemical Engg';
  } else if (name.includes('air hostess') || name.includes('purser') || name.includes('cabin crew') || name.includes('aviation')) {
    return 'Aviation & Hospitality';
  } else if (name.includes('information technology') || name.includes('software') || name.includes('computer') || name.includes('data scientist')) {
    return 'IT & Software Engineering';
  }

  // Fallback to text content
  if (allText.includes('engineering') || allText.includes('b.tech') || allText.includes('b.e.')) {
    return 'Engineering & Technology';
  } else if (allText.includes('medical') || allText.includes('health') || allText.includes('doctor')) {
    return 'Medical & Healthcare';
  } else if (allText.includes('commerce') || allText.includes('finance') || allText.includes('accounting')) {
    return 'Commerce & Finance';
  } else if (allText.includes('design') || allText.includes('creative') || allText.includes('arts')) {
    return 'Arts & Creative Design';
  }

  return careerData.stream || 'Professional Stream';
}

export function parseSalary(careerData) {
  if (!careerData) return '\u20B925,000 \u2013 \u20B980,000 / mo';
  const inc = careerData.expected_income;
  if (!inc) return '\u20B925,000 \u2013 \u20B980,000 / mo';

  const min = inc.minimum_monthly_salary_inr || inc.minimum_monthly_salary || inc.minimum_salary;
  const max = inc.maximum_monthly_salary_inr || inc.maximum_monthly_salary || inc.maximum_salary;

  if (min && max) {
    const minStr = typeof min === 'number' ? `\u20B9${min.toLocaleString('en-IN')}` : (String(min).startsWith('\u20B9') || String(min).startsWith('INR') ? String(min) : `\u20B9${min}`);
    const maxStr = typeof max === 'number' ? `\u20B9${max.toLocaleString('en-IN')}` : (String(max).startsWith('\u20B9') || String(max).startsWith('INR') ? String(max) : `\u20B9${max}`);
    return `${minStr} \u2013 ${maxStr} / mo`;
  }
  if (min) return `From \u20B9${Number(min).toLocaleString('en-IN')} / mo`;
  if (typeof inc === 'string') return inc;
  return '\u20B925,000 \u2013 \u20B980,000 / mo';
}

export function parseCourseFee(careerData) {
  if (!careerData) return '\u20B950,000 \u2013 \u20B92,00,000';
  const fee = careerData.course_fee;
  if (!fee) return '\u20B950,000 \u2013 \u20B92,00,000';

  const min = fee.minimum_inr || fee.minimum_fee;
  const max = fee.maximum_inr || fee.maximum_fee;

  if (min && max) {
    return `\u20B9${Number(min).toLocaleString('en-IN')} \u2013 \u20B9${Number(max).toLocaleString('en-IN')}`;
  }
  if (max) return `Up to \u20B9${Number(max).toLocaleString('en-IN')}`;
  if (fee.estimated_total_fee) return fee.estimated_total_fee;
  if (fee.fee_range) return fee.fee_range;
  if (typeof fee === 'string') return fee;
  return '\u20B950,000 \u2013 \u20B92,00,000';
}

export function parseTraits(careerData) {
  if (!careerData) return 'Analytical Thinking, Problem Solving, Teamwork';
  const rawTraits = careerData.personality_traits;
  if (Array.isArray(rawTraits) && rawTraits.length > 0) {
    const cleaned = rawTraits.map(t => {
      if (typeof t !== 'string') return '';
      return t
        .replace(/^You (are good at|have a strong interest in|pay attention to|like to work in|like to analyse|like to do|like to|are)\s+/i, '')
        .replace(/\.$/, '')
        .trim();
    }).filter(Boolean);
    return cleaned.slice(0, 3).join(', ') || 'Analytical, Problem Solving, Teamwork';
  }
  if (typeof rawTraits === 'string') return rawTraits;
  return 'Analytical Thinking, Problem Solving, Teamwork';
}

export function parseGrowthPath(careerData) {
  if (!careerData) return 'Trainee \u2192 Associate \u2192 Senior Lead \u2192 Manager';
  const growth = careerData.expected_growth_path || careerData.growth_path;
  if (!growth) return 'Trainee \u2192 Associate \u2192 Senior Lead \u2192 Manager';

  if (Array.isArray(growth) && growth.length > 0) {
    // If element is an object with 'path' array (e.g. Smart Manufacturing)
    if (growth[0] && Array.isArray(growth[0].path)) {
      return growth[0].path.join(' \u2192 ');
    }
    return growth.map(item => {
      if (!item) return '';
      if (typeof item === 'string') return item;
      if (Array.isArray(item.path)) return item.path.join(' \u2192 ');
      return item.role || item.title || item.name || item.stage || '';
    }).filter(Boolean).join(' \u2192 ');
  }

  if (typeof growth === 'string') return growth;
  return 'Trainee \u2192 Associate \u2192 Senior Lead \u2192 Manager';
}
