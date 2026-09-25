'use client';

import { useEffect } from 'react';
import { trackDesignView, trackServiceView } from '@/lib/analytics/events';

interface TrackDesignProps {
  type: 'design';
  slug: string;
  title: string;
  category?: string;
}

interface TrackServiceProps {
  type: 'service';
  slug: string;
  title: string;
}

type TrackItemViewProps = TrackDesignProps | TrackServiceProps;

export function TrackItemView(props: TrackItemViewProps) {
  useEffect(() => {
    if (props.type === 'design') {
      trackDesignView({
        slug: props.slug,
        title: props.title,
        category: props.category,
      });
    } else if (props.type === 'service') {
      trackServiceView({
        slug: props.slug,
        title: props.title,
      });
    }
  }, [props]);

  return null;
}
