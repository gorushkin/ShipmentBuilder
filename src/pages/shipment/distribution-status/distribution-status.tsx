import { CheckCircle2 } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

import './distribution-status.css'
export function DistributionStatus() { return <Alert className="guidance" role="status"><CheckCircle2 aria-hidden="true" /><AlertTitle>Заказ проверен.</AlertTitle><AlertDescription>Товары ожидают распределения</AlertDescription></Alert> }
