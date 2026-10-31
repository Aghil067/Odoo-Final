import type {Transaction} from '../../lib/db.js';
import type {Prisma} from '@prisma/client';
import {ApiError} from '../../lib/http.js';
// Caller establishes customer/service authority. Reopening must not silently reuse a prior closure's billing approval.
export async function assertServiceSnapshot(tx:Transaction,ticketId:string,snapshot:Prisma.JsonValue){const t=await tx.serviceTicket.findUniqueOrThrow({where:{id:ticketId},select:{status:true,executionRevision:true}}),review=await tx.serviceClosureReview.findFirst({where:{ticketId},orderBy:{ticketVersion:'desc'}}),frozen=snapshot as {closureReviewId?:unknown;executionRevision?:unknown};if(t.status!=='CLOSED'||!review||!frozen||frozen.closureReviewId!==review.id||frozen.executionRevision!==t.executionRevision)throw new ApiError(409,'FINANCE_SERVICE_SOURCE_STALE','Service closure cycle changed; create a new reviewed charge request instead of reusing its old approval');}
