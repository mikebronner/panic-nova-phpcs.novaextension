<?php

namespace App\Http\Controllers\Webhooks\HelloSign;

use App\Http\Controllers\Controller;
use App\Http\Requests\Webhooks\HelloSign\Request;

class SignatureRequestControllerExtraLongClassnameNeverEnds extends Controller
{
    public function store(Request $request)
    {
       $response = $request->process();
  asd  f
        return $response;  5  
    }
} 
