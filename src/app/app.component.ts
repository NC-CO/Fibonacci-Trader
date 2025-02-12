import { Component, Input, AfterViewInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import * as testData from '../assets/test.json';
import Chart from 'chart.js/auto';
import { DatePipe } from '@angular/common';
import { CookieService } from 'ngx-cookie-service';
import anime from 'animejs';

//Make website called StockSorcerer.com and make a funny YouTube ad where you're wearing a wizard hat and beard 
//in the woods doing CGI magic and talking about the site

interface Stock {
  value: string;
  viewValue: string;
}

interface TimeFrame {
  value: string;
  viewValue: string;
}

interface StockData {
  'Meta Data': {
      '1. Information': string;
      '2. Symbol': string;
      '3. Last Refreshed': string;
      '4. Interval': string;
      '5. Output Size': string;
      '6. Time Zone': string;
  };
  'Time Series (5min)': {
      [timestamp: string]: {
          '1. open': string;
          '2. high': string;
          '3. low': string;
          '4. close': string;
          '5. volume': string;
      };
  };
  'Time Series (Daily)': {
    [timestamp: string]: {
        '1. open': string;
        '2. high': string;
        '3. low': string;
        '4. close': string;
        '5. volume': string;
    };
  };
  'Weekly Time Series': {
    [timestamp: string]:{
        '1. open': string;
        '2. high': string;
        '3. low': string;
        '4. close': string;
        '5. volume': string;
    };
  };
  'Monthly Time Series': {
    [timestamp: string]:{
        '1. open': string;
        '2. high': string;
        '3. low': string;
        '4. close': string;
        '5. volume': string;
    };
  };
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})

export class AppComponent implements AfterViewInit{

  ngAfterViewInit(): void {
    anime.timeline({loop: false})
      .add({
        targets: '.big-title',
        translateY: ["1.1em", 0],
        translateX: ["13.55em", 0],
        translateZ: 0,
        rotateZ: [40, 0],
        duration: 2600,
        //easing: "easeOutExpo",
      }).add({
        targets: '.big-title',
        duration: 2050,
        translateY: [0, "-0.5em"],
        skewX: -7,
        skewY: -3.5,
        delay: 650, 
        //easing: "easeOutExpo",
      }).add({
        targets: '.big-title',
        duration: 2460,
        translateY: ["-0.5em", 0],
        skewX: 0,
        skewY: 0,
       // delay: 2700, 
        //easing: "easeOutExpo",
      });
    anime.timeline({loop: false})
    .add({
      targets: '.left-bar',
      translateY: ["10.1em", 0],
      translateX: ["-20.55em", 0],
      rotateZ: [20, 0],
      duration: 1580,
      //easing: "easeInExpo",
      delay: 0
    });
  }

  public chart: any;
  public isLoading = true;
  datepipe: DatePipe = new DatePipe('en-US');
  userName: string = 'user69';
  title = 'Fibonacci-Trader';
  responseObject: JSON = <JSON>{};
  str: string = '';
  strr: string = '';
  jsonStuff: JSON = <JSON>{};
  //data: StockData = testData;
  array: Array<number> = [];
  arrayTuple: Array<{x:string, y:number}> = [];
  indexArr: Array<string> = [];
  valleyArray: Array<number> = []; 
  peakArray: Array<number> = [];
  timeFrame: string;
  selectedStock: string;
  interval: string;
  function: string;
  absoluteMax: number = 0;
  peakAndValleyArray: Array<{x:string, y:number}> = [];
  significantPoints: [Array<{x:string, y:number}>, Array<{x:string, y:number}>, boolean] = [[],[], false];
  bullishCrab: [Array<{x:string, y:number}>, Array<{x:string, y:number}>, boolean, number] = [[],[], false, 0];
  bearishCrab: [Array<{x:string, y:number}>, Array<{x:string, y:number}>, boolean, number] = [[],[], false, 0];
  bullishShark: [Array<{x:string, y:number}>, Array<{x:string, y:number}>, boolean, number] = [[],[], false, 0];
  bearishShark: [Array<{x:string, y:number}>, Array<{x:string, y:number}>, boolean, number] = [[],[], false, 0];
  bullishBat: [Array<{x:string, y:number}>, Array<{x:string, y:number}>, boolean, number] = [[],[], false, 0];
  bearishBat: [Array<{x:string, y:number}>, Array<{x:string, y:number}>, boolean, number] = [[],[], false, 0];
  score = 0;
  datasets: Array<{label:string, data: Array<{x:string, y:number}>, borderColor: string, fill: boolean, backgroundColor: string, pointBackgroundColor: string, borderDash: [number, number]}> = [];

  constructor(private http: HttpClient, private cookieService: CookieService) {
    this.timeFrame = 'daily'; //daily or intraday
    this.selectedStock = 'aapl';
    this.interval = '5min';
    this.function = '';
  }
  public ngOnInit(): void {
    this.callAPI();
    const firstVisit = this.cookieService.get('firstVisit');
    if (!firstVisit) {
      this.cookieService.set('firstVisit', new Date().toUTCString(), { expires: 1095 });
      console.log('newbie');
    } else {
      console.log('back again');
    }
  }

  callAPI() {
    this.array = [];
    this.indexArr = [];
    this.peakAndValleyArray = [];
    this.arrayTuple = [];
    this.datasets = [];
    this.score = 0;
    this.bullishCrab = [[],[], false, 0];
    this.bearishCrab = [[],[], false, 0];
    this.bullishShark = [[],[], false, 0];
    this.bearishShark = [[],[], false, 0];
    this.bullishBat = [[],[], false, 0];
    this.bearishBat = [[],[], false, 0];
    let url  = '';
    if (this.timeFrame == 'daily') {
      url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${ this.selectedStock }&apikey=3Q62PTYW8KBTOCQ2`;
    } else if (this.timeFrame == 'weekly') {
      url = `https://www.alphavantage.co/query?function=TIME_SERIES_WEEKLY&symbol=${ this.selectedStock }&outputsize=compact&apikey=3Q62PTYW8KBTOCQ2`;
    } else if (this.timeFrame == 'monthly') {
      url = `https://www.alphavantage.co/query?function=TIME_SERIES_MONTHLY&symbol=${ this.selectedStock }&outputsize=compact&apikey=3Q62PTYW8KBTOCQ2`;
    } else {
      url = `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${ this.selectedStock }&interval=${ this.interval }&entitlement=delayed&outputsize=compact&apikey=3Q62PTYW8KBTOCQ2`;
    }
    this.http.get<StockData>(url).subscribe((response) => {
      //!Giving reponse but doesn't want to be assigned!
      [this.array, this.indexArr] = this.jsonToArray(response);
      //console.log('this.array = '+this.array.length)
      for (let i = 0; i < this.array.length; i++) {
        this.arrayTuple.push({x:this.indexArr[i], y:this.array[i]});
      }
      this.peakAndValleyArray = this.peakAndValleyFinder();
      //this.significantPoints = this.fibonacciFinder(this.peakAndValleyArray);
      this.bullishCrab = this.bullishCrabFinder(this.peakAndValleyArray);
      this.bearishCrab = this.bearishCrabFinder(this.peakAndValleyArray);
      this.bullishShark = this.bullishSharkFinder(this.peakAndValleyArray);
      this.bearishShark = this.bearishSharkFinder(this.peakAndValleyArray);
      this.bullishBat = this.bullishBatFinder(this.peakAndValleyArray);
      this.bearishBat = this.bearishBatFinder(this.peakAndValleyArray);
      // plot rightmost pattern, and if there is none, plot whatever you find
      if (this.bullishCrab[2] === true) {
        this.datasets.push({label: 'Bullish Crab Predicted Trend', data: this.bullishCrab[1], borderColor: 'gold', fill: false, backgroundColor: '', pointBackgroundColor: 'gold', borderDash: [6, 7]})
        this.datasets.push({label: 'Bullish Crab', data: this.bullishCrab[0], borderColor: 'gold', fill: false, backgroundColor: '', pointBackgroundColor: '', borderDash: [0,0]});
        this.score =  Math.round(this.bullishCrab[3] * 100);
      } else if (this.bearishCrab[2] === true) {
        this.datasets.push({label: 'Bearish Crab Predicted Trend', data: this.bearishCrab[1], borderColor: 'gold', fill: false, backgroundColor: '', pointBackgroundColor: '', borderDash: [6, 7]})
        this.datasets.push({label: 'Bearish Crab', data: this.bearishCrab[0], borderColor: 'gold', fill: false, backgroundColor: '', pointBackgroundColor: '', borderDash: [0,0]});
        this.score =  Math.round(this.bearishCrab[3] * 100);
      } else if (this.bullishShark[2] === true) {
        this.datasets.push({label: 'Bullish Shark Predicted Trend', data: this.bullishShark[1], borderColor: 'gold', fill: false, backgroundColor: '', pointBackgroundColor: 'gold', borderDash: [6, 7]})
        this.datasets.push({label: 'Bullish Shark', data: this.bullishShark[0], borderColor: 'gold', fill: false, backgroundColor: '', pointBackgroundColor: '', borderDash: [0,0]});
        this.score =  Math.round(this.bullishShark[3] * 100);
      } else if (this.bearishShark[2] === true) {
        this.datasets.push({label: 'Bearish Shark Predicted Trend', data: this.bearishShark[1], borderColor: 'gold', fill: false, backgroundColor: '', pointBackgroundColor: '', borderDash: [6, 7]})
        this.datasets.push({label: 'Bearish Shark', data: this.bearishShark[0], borderColor: 'gold', fill: false, backgroundColor: '', pointBackgroundColor: '', borderDash: [0,0]});
        this.score =  Math.round(this.bearishShark[3] * 100);
      } else if (this.bullishBat[2] === true) {
        this.datasets.push({label: 'Bullish Bat Predicted Trend', data: this.bullishBat[1], borderColor: 'gold', fill: false, backgroundColor: '', pointBackgroundColor: '', borderDash: [6, 7]})
        this.datasets.push({label: 'Bullish Bat', data: this.bullishBat[0], borderColor: 'gold', fill: false, backgroundColor: '', pointBackgroundColor: '', borderDash: [0,0]});
        this.score =  Math.round(this.bullishBat[3] * 100);
      } else if (this.bearishBat[2] === true) {
        this.datasets.push({label: 'Bearish Bat Predicted Trend', data: this.bearishBat[1], borderColor: 'gold', fill: false, backgroundColor: '', pointBackgroundColor: '', borderDash: [6, 7]})
        this.datasets.push({label: 'Bearish Bat', data: this.bearishBat[0], borderColor: 'gold', fill: false, backgroundColor: '', pointBackgroundColor: '', borderDash: [0,0]});
        this.score =  Math.round(this.bearishBat[3] * 100);
      } else {
        if (this.bullishCrab[0].length != 0) {
          this.datasets.push({label: 'Bullish Crab Predicted Trend', data: this.bullishCrab[1], borderColor: 'gold', fill: false, backgroundColor: '', pointBackgroundColor: 'gold', borderDash: [6, 7]})
          this.datasets.push({label: 'Bullish Crab', data: this.bullishCrab[0], borderColor: 'gold', fill: false, backgroundColor: '', pointBackgroundColor: '', borderDash: [0,0]});
          this.score =  Math.round(this.bullishCrab[3] * 100);
        } else if (this.bearishCrab[0].length != 0) {
          this.datasets.push({label: 'Bearish Crab Predicted Trend', data: this.bearishCrab[1], borderColor: 'gold', fill: false, backgroundColor: '', pointBackgroundColor: '', borderDash: [6, 7]})
          this.datasets.push({label: 'Bearish Crab', data: this.bearishCrab[0], borderColor: 'gold', fill: false, backgroundColor: '', pointBackgroundColor: '', borderDash: [0,0]});
          this.score =  Math.round(this.bearishCrab[3] * 100);
        } else if (this.bullishShark[0].length != 0) {
          this.datasets.push({label: 'Bullish Shark Predicted Trend', data: this.bullishShark[1], borderColor: 'gold', fill: false, backgroundColor: '', pointBackgroundColor: 'gold', borderDash: [6, 7]})
          this.datasets.push({label: 'Bullish Shark', data: this.bullishShark[0], borderColor: 'gold', fill: false, backgroundColor: '', pointBackgroundColor: '', borderDash: [0,0]});
          this.score =  Math.round(this.bullishShark[3] * 100);
        } else if (this.bearishShark[0].length != 0) {
          this.datasets.push({label: 'Bearish Shark Predicted Trend', data: this.bearishShark[1], borderColor: 'gold', fill: false, backgroundColor: '', pointBackgroundColor: '', borderDash: [6, 7]})
          this.datasets.push({label: 'Bearish Shark', data: this.bearishShark[0], borderColor: 'gold', fill: false, backgroundColor: '', pointBackgroundColor: '', borderDash: [0,0]});
          this.score =  Math.round(this.bearishShark[3] * 100);
        } else if (this.bullishBat[0].length != 0) {
          this.datasets.push({label: 'Bullish Bat Predicted Trend', data: this.bullishBat[1], borderColor: 'gold', fill: false, backgroundColor: '', pointBackgroundColor: '', borderDash: [6, 7]})
          this.datasets.push({label: 'Bullish Bat', data: this.bullishBat[0], borderColor: 'gold', fill: false, backgroundColor: '', pointBackgroundColor: '', borderDash: [0,0]});
          this.score =  Math.round(this.bullishBat[3] * 100);
        } else if (this.bearishBat[0].length != 0) {
          this.datasets.push({label: 'Bearish Bat Predicted Trend', data: this.bearishBat[1], borderColor: 'gold', fill: false, backgroundColor: '', pointBackgroundColor: '', borderDash: [6, 7]})
          this.datasets.push({label: 'Bearish Bat', data: this.bearishBat[0], borderColor: 'gold', fill: false, backgroundColor: '', pointBackgroundColor: '', borderDash: [0,0]});
          this.score =  Math.round(this.bearishBat[3] * 100);
        }
      }
      this.datasets.push({label: 'Intelli Points', data: this.peakAndValleyArray, fill: false, borderColor: 'forestgreen', backgroundColor: '', pointBackgroundColor: 'green', borderDash: [0,0]});
      this.datasets.push({label: this.selectedStock.toLocaleUpperCase(), data: this.arrayTuple, fill: true, borderColor: 'rgba(0,0,0,0.8)', backgroundColor: 'rgba(0,0,0,0.5)', pointBackgroundColor: 'rgba(0,0,0,0.1)', borderDash: [0,0]})
      this.createChart();

      // AlphaVantage API key = 3Q62PTYW8KBTOCQ2
      // fibonacciFinder(peaksAndValleryArray); -bigger array (dotted continuation at end)
    });
  }

  public createChart(){
    this.isLoading = true; // Set loading to true when chart creation starts
    this.chart = new Chart("MyChart", {
      type: 'line', //this denotes tha type of chart
      data: {// values on X-Axis
        labels: this.indexArr,
        datasets: this.datasets,
      },
      options: {
        //devicePixelRatio: 1.3,
        responsive: true,
        plugins: {
          legend: {
            labels: {
                color: "black",
                font: {
                  size: 18,
                },
            }
          }
        },
        scales: {
          y: {
            ticks: {
              color: "dark grey", // not 'fontColor:' anymore
              font: {
                size: 19,
              },
              stepSize: 1,
            }
          },
          x: {
            ticks: {
              color: "dark grey",
              font: {
                size: 19,
              },
              stepSize: 1,
            }
          }
        }
      }
    });
    this.isLoading = false; // Set loading to false when chart creation ends
  }

//!!! Update this to take weekly and monthly data!!! Account for 'Weekly Time Series' & 'Monthly Time Series'
  public jsonToArray(response: StockData): [Array<number>, Array<string>] {
    // build the index
    let index = [];
    let valArray: Array<number> = [];
    let indexArray: Array<string> = [];
    let selectedTimeframe = '';
    //Find out what type of timeframe we're receiving and pull it's data
    if (response['Time Series (5min)'] !== undefined) {
      selectedTimeframe = 'intraday';
      for (let x in response['Time Series (5min)']) {
        index.push(x);
      }
      for (let i = index.length - 1; i >= 0; i--) {
        valArray.push(Number(response['Time Series (5min)'][index[i]]['4. close']));
        indexArray.push(index[i]);
      }
    } else if (response['Time Series (Daily)'] !== undefined) {
      selectedTimeframe = 'daily';
      for (let x in response['Time Series (Daily)']) {
        index.push(x);
      }
      for (let i = index.length - 1; i >= 0; i--) {
        valArray.push(Number(response['Time Series (Daily)'][index[i]]['4. close']));
        indexArray.push(index[i]);
      }
    } else if (response['Weekly Time Series'] !== undefined) {
      selectedTimeframe = 'weekly';
      for (let x in response['Weekly Time Series']) {
        index.push(x);
      }
      for (let i = index.length - 1; i >= 0; i--) {
        valArray.push(Number(response['Weekly Time Series'][index[i]]['4. close']));
        indexArray.push(index[i]);
      }
    } else if (response['Monthly Time Series'] !== undefined) {
      selectedTimeframe = 'monthly';
      for (let x in response['Monthly Time Series']) {
        index.push(x);
      }
      for (let i = index.length - 1; i >= 0; i--) {
        valArray.push(Number(response['Monthly Time Series'][index[i]]['4. close']));
        indexArray.push(index[i]);
      }
    }
    
    return [valArray, indexArray];
  }

  setStock(newStock: Stock | null) {
    this.selectedStock = newStock!.value;
    this.chart.destroy();
    this.callAPI();
  }

  setTimeFrame(newTimeFrame: TimeFrame | null) {
    this.timeFrame = newTimeFrame!.value;
    this.chart.destroy();
    this.callAPI();
  }

  public peakAndValleyFinder(): Array<{x:string, y:number}> {
    let peakAndValleyArray: Array<{x:string, y:number}> = [];
    let all = [];
    let graphTotal = 0;
    for (let i = 0; i < this.array.length; i++) {
      all.push({x:this.indexArr[i], y:this.array[i], z:i});
      graphTotal += this.array[i];
    }

    let graphAvg = graphTotal / this.array.length;

    let subsectionCount = 10;
    let subsectionArray = [];
    let subsectionSize = Math.ceil(all.length / subsectionCount);

    for (let i = 0; i < subsectionCount; i++) {
      let start = i * subsectionSize;
      let end = start + subsectionSize;
      let subsection = all.slice(start, end);
      subsectionArray.push(subsection);
      console.log('subsection seam = '+subsection[subsection.length - 1].x);
    }
    
    let subsectionSeams = [];
    for (let i = 0; i < subsectionArray.length; i++) {
      subsectionSeams.push(subsectionArray[i][subsectionArray[i].length - 1].z);
    }

    console.log('subsection size: '+subsectionSize);
    // Loop to console.log every element of subsectionArray
    for (let i = 0; i < subsectionArray.length; i++) {
      for (let j = 0; j < subsectionArray[i].length; j++) {
        //console.log('subsection ' + i + ': '+subsectionArray[i][j].x + ', ' + subsectionArray[i][j].y + ', ' + subsectionArray[i][j].z);
      }
    }

    let subsectionArrayMinsMaxesOnly = [];
    for (let i = 0; i < subsectionArray.length; i++) {
      let subsection = subsectionArray[i];
      if (subsection.length > 0) {
        let minY = subsection[0].y;
        let maxY = subsection[0].y;
        let minX = subsection[0].x;
        let maxX = subsection[0].x;
        let minZ = subsection[0].z;
        let maxZ = subsection[0].z;
        for (let j = 1; j < subsection.length; j++) {
          if (subsection[j].y < minY) {
            minY = subsection[j].y;
            minX = subsection[j].x;
            minZ = subsection[j].z;
          }
          if (subsection[j].y > maxY) {
            maxY = subsection[j].y;
            maxX = subsection[j].x;
            maxZ = subsection[j].z;
          }
        }
        subsectionArrayMinsMaxesOnly.push({minX, minY, minZ, maxX, maxY, maxZ});
      }
    }

    //remove any min/max pairs that are directly next to eachother
    for (let i = 0; i < subsectionArrayMinsMaxesOnly.length - 1; i++) {
      //if maxes are directly next to eachother, only plot larger one
      if (subsectionArrayMinsMaxesOnly[i].minZ === subsectionArrayMinsMaxesOnly[i + 1].minZ - 1) {
        if (subsectionArrayMinsMaxesOnly[i].minY < subsectionArrayMinsMaxesOnly[i + 1].minY) {
          subsectionArrayMinsMaxesOnly[i + 1].minX = '0';
        } else {
          subsectionArrayMinsMaxesOnly[i].minX = '0';
        }
      }
      //if mins are directly next to eachother, only plot smaller one
      if (subsectionArrayMinsMaxesOnly[i].maxZ === subsectionArrayMinsMaxesOnly[i + 1].maxZ - 1) {
        if (subsectionArrayMinsMaxesOnly[i].maxY > subsectionArrayMinsMaxesOnly[i + 1].maxY) {
          subsectionArrayMinsMaxesOnly[i + 1].maxX = '0';
        } else {
          subsectionArrayMinsMaxesOnly[i].maxX = '0';
        }
      }
      // if a min is directly followed by a max, set both to zero, this is a mid-slope seam error
      if (subsectionArrayMinsMaxesOnly[i].minZ === (subsectionArrayMinsMaxesOnly[i + 1].maxZ - 1)) {
          subsectionArrayMinsMaxesOnly[i].minX = '0';
          subsectionArrayMinsMaxesOnly[i+1].maxX = '0';
      }
      // if a max is directly followed by a min, set both to zero, this is a mid-slope seam error
      if (subsectionArrayMinsMaxesOnly[i].maxZ === (subsectionArrayMinsMaxesOnly[i + 1].minZ - 1)) {
          subsectionArrayMinsMaxesOnly[i].maxX = '0';
          subsectionArrayMinsMaxesOnly[i+1].minX = '0';
      }
      //if a min is on a seam (last point of subsection), check if first point of next subsection is less
      if (subsectionArrayMinsMaxesOnly[i].minX !== '0') {
        if (subsectionArrayMinsMaxesOnly[i].minZ === subsectionSeams[i]) {
          if (subsectionArrayMinsMaxesOnly[i].minY > subsectionArray[i + 1][0].y) {
            subsectionArrayMinsMaxesOnly[i].minX = '0';
          }
        }
      }
      //if a max is on a seam (last point of subsection), check if first point of next subsection is greater
      if (subsectionArrayMinsMaxesOnly[i].maxX !== '0') {
        if (subsectionArrayMinsMaxesOnly[i].maxZ === subsectionSeams[i]) {
          if (subsectionArrayMinsMaxesOnly[i].maxY < subsectionArray[i + 1][0].y) {
            subsectionArrayMinsMaxesOnly[i].maxX = '0';
          }
        }
      }
    }
    //make subsectionArraySortedByZ into 1d list, don't add x = 0 values. 
    //this escapes the current pairs format that has limitations and removes 0s thus far
    let subsectionArraySortedByZ = [];
    for (let i = 0; i < subsectionArrayMinsMaxesOnly.length; i++) {
      if (subsectionArrayMinsMaxesOnly[i].minZ > subsectionArrayMinsMaxesOnly[i].maxZ) {
        if (subsectionArrayMinsMaxesOnly[i].maxX !== '0') {
          subsectionArraySortedByZ.push({ x: subsectionArrayMinsMaxesOnly[i].maxX, y: subsectionArrayMinsMaxesOnly[i].maxY, z: subsectionArrayMinsMaxesOnly[i].maxZ, pairOrder: '1st of 2'});
        }
        if (subsectionArrayMinsMaxesOnly[i].minX !== '0') {
          subsectionArraySortedByZ.push({ x: subsectionArrayMinsMaxesOnly[i].minX, y: subsectionArrayMinsMaxesOnly[i].minY, z: subsectionArrayMinsMaxesOnly[i].minZ, pairOrder: '2nd of 2'});
        }
      } else {
        if (subsectionArrayMinsMaxesOnly[i].minX !== '0') {
          subsectionArraySortedByZ.push({ x: subsectionArrayMinsMaxesOnly[i].minX, y: subsectionArrayMinsMaxesOnly[i].minY, z: subsectionArrayMinsMaxesOnly[i].minZ, pairOrder: '2nd of 2'});
        } 
        if (subsectionArrayMinsMaxesOnly[i].maxX !== '0') {
          subsectionArraySortedByZ.push({ x: subsectionArrayMinsMaxesOnly[i].maxX, y: subsectionArrayMinsMaxesOnly[i].maxY, z: subsectionArrayMinsMaxesOnly[i].maxZ, pairOrder: '1st of 2'});
        }
      }
    }

    //1.) fix yellow line plotter (out of order sometimes and sometimes the dotted line at the end is steep! )
    let absoluteMax = 0;
    let absoluteMin = all[0].y;
    for (let i = 0; i < all.length; i++) {
      if (all[i].y > absoluteMax) {
        absoluteMax = all[i].y;
      }
      if (all[i].y < absoluteMin) {
        absoluteMin = all[i].y;
      }
    }
    
    let range = absoluteMax - absoluteMin;
    for (let i = 0; i < subsectionArraySortedByZ.length - 1; i++) {
      let byeByeNeighborDistance = 2;
      if (Math.abs(subsectionArraySortedByZ[i+1].z - subsectionArraySortedByZ[i].z) <= byeByeNeighborDistance) {
        //beginning edge case
        if (subsectionArraySortedByZ[i].z < byeByeNeighborDistance) {
          if (range / Math.abs(subsectionArraySortedByZ[i+1].y - subsectionArraySortedByZ[i].y) > 0.15) {
            break;
          }
          if (subsectionArraySortedByZ[i].z === 0) {
            let localAvg = (all[0].y + all[1].y + all[2].y + all[3].y + all[4].y)/5;
            if (subsectionArraySortedByZ[i].y < localAvg) {
              if (subsectionArraySortedByZ[i].y < subsectionArraySortedByZ[i+1].y) {
                subsectionArraySortedByZ.splice(i+1, 1);
              } else {
                subsectionArraySortedByZ.splice(i, 1);
              }
            } else {
              if (subsectionArraySortedByZ[i].y > subsectionArraySortedByZ[i+1].y) {
                subsectionArraySortedByZ.splice(i+1, 1);
              } else {
                subsectionArraySortedByZ.splice(i, 1);
              }
            }
          }
          else if (subsectionArraySortedByZ[i].z === 1) {
            let localAvg = (all[0].y + all[1].y + all[2].y + all[3].y + all[4].y)/5;
            if (subsectionArraySortedByZ[i].y < localAvg) {
              if (subsectionArraySortedByZ[i].y < subsectionArraySortedByZ[i+1].y) {
                subsectionArraySortedByZ.splice(i+1, 1);
              } else {
                subsectionArraySortedByZ.splice(i, 1);
              }
            } else {
              if (subsectionArraySortedByZ[i].y > subsectionArraySortedByZ[i+1].y) {
                subsectionArraySortedByZ.splice(i+1, 1);
              } else {
                subsectionArraySortedByZ.splice(i, 1);
              }
            }
          } else if (subsectionArraySortedByZ[i].z === 2) {
            let localAvg = (all[0].y + all[1].y + all[2].y + all[3].y + all[4].y + all[5].y)/6;
            if (subsectionArraySortedByZ[i].y < localAvg) {
              if (subsectionArraySortedByZ[i].y < subsectionArraySortedByZ[i+1].y) {
                subsectionArraySortedByZ.splice(i+1, 1);
              } else {
                subsectionArraySortedByZ.splice(i, 1);
              }
            } else {
              if (subsectionArraySortedByZ[i].y > subsectionArraySortedByZ[i+1].y) {
                subsectionArraySortedByZ.splice(i+1, 1);
              } else {
                subsectionArraySortedByZ.splice(i, 1);
              }
            }
          } else if (subsectionArraySortedByZ[i].z === 3) {
            let localAvg = (all[0].y + all[1].y + all[2].y + all[3].y + all[4].y + all[5].y + all[6].y)/7;
            if (subsectionArraySortedByZ[i].y < localAvg) {
              if (subsectionArraySortedByZ[i].y < subsectionArraySortedByZ[i+1].y) {
                subsectionArraySortedByZ.splice(i+1, 1);
              } else {
                subsectionArraySortedByZ.splice(i, 1);
              }
            } else {
              if (subsectionArraySortedByZ[i].y > subsectionArraySortedByZ[i+1].y) {
                subsectionArraySortedByZ.splice(i+1, 1);
              } else {
                subsectionArraySortedByZ.splice(i, 1);
              }
            }
          } else if (subsectionArraySortedByZ[i].z === 4) {
            let localAvg = (all[0].y + all[1].y + all[2].y + all[3].y + all[4].y + all[5].y + all[6].y + all[7].y)/8;
            if (subsectionArraySortedByZ[i].y < localAvg) {
              if (subsectionArraySortedByZ[i].y < subsectionArraySortedByZ[i+1].y) {
                subsectionArraySortedByZ.splice(i+1, 1);
              } else {
                subsectionArraySortedByZ.splice(i, 1);
              }
            } else {
              if (subsectionArraySortedByZ[i].y > subsectionArraySortedByZ[i+1].y) {
                subsectionArraySortedByZ.splice(i+1, 1);
              } else {
                subsectionArraySortedByZ.splice(i, 1);
              }
            }
          } //middle section
        } else if (subsectionArraySortedByZ[i].z > byeByeNeighborDistance && subsectionArraySortedByZ[i].z < (all.length - byeByeNeighborDistance)) {
//!!start here (Microsoft stock) save point 2 points away from being cut by doing a Break; if y is 
// large proportionally to overall max minus overall min. make this check a dynamic distance away 
// based on byByeNeighborDistance
          if (range / Math.abs(subsectionArraySortedByZ[i+1].y - subsectionArraySortedByZ[i].y) > 0.15) {
            break;
          }
          //after this, do same for beginning edge case and end edge case
          //then write algo for detecting smooth moving graph (Alphabet stock) and make it plot better for those
          //after then fix issue with alphabet stock where it isn't plotting local min (2024-11-04)
          let localAvg = subsectionArraySortedByZ[i].y;
          for (let j = 0; j < byeByeNeighborDistance; j++) {
            localAvg += all[subsectionArraySortedByZ[i].z - j].y;
            localAvg += all[subsectionArraySortedByZ[i].z + j].y;
          }
          localAvg = localAvg / (byeByeNeighborDistance * 2 + 1);
          if (subsectionArraySortedByZ[i].y < localAvg) {
            if (subsectionArraySortedByZ[i].y < subsectionArraySortedByZ[i+1].y) {
              subsectionArraySortedByZ.splice(i+1, 1);
            } else {
              subsectionArraySortedByZ.splice(i, 1);
            }
          } else {
            if (subsectionArraySortedByZ[i].y > subsectionArraySortedByZ[i+1].y) {
              subsectionArraySortedByZ.splice(i+1, 1);
            } else {
              subsectionArraySortedByZ.splice(i, 1);
            }
          }
        } else {
          //end edge case
          if (range / Math.abs(subsectionArraySortedByZ[i].y - subsectionArraySortedByZ[i-1].y) > 0.15) {
            break;
          }
          if (subsectionArraySortedByZ[i].z === all.length - 1) {
            let localAvg = (all[all.length - 1].y + all[all.length - 2].y + all[all.length - 3].y + all[all.length - 4].y + all[all.length - 5].y)/5;
            if (subsectionArraySortedByZ[i].y < localAvg) {
              if (subsectionArraySortedByZ[i].y < subsectionArraySortedByZ[i - 1].y) {
                subsectionArraySortedByZ.splice(i - 1, 1);
              } else {
                subsectionArraySortedByZ.splice(i, 1);
              }
            } else {
              if (subsectionArraySortedByZ[i].y > subsectionArraySortedByZ[i - 1].y) {
                subsectionArraySortedByZ.splice(i - 1, 1);
              } else {
                subsectionArraySortedByZ.splice(i, 1);
              }
            }
          }
          else if (subsectionArraySortedByZ[i].z === all.length - 2) {
            let localAvg = (all[all.length - 1].y + all[all.length - 2].y + all[all.length - 3].y + all[all.length - 4].y + all[all.length - 5].y)/5;
            if (subsectionArraySortedByZ[i].y < localAvg) {
              if (subsectionArraySortedByZ[i].y < subsectionArraySortedByZ[i-1].y) {
                subsectionArraySortedByZ.splice(i-1, 1);
              } else {
                subsectionArraySortedByZ.splice(i, 1);
              }
            } else {
              if (subsectionArraySortedByZ[i].y > subsectionArraySortedByZ[i-1].y) {
                subsectionArraySortedByZ.splice(i-1, 1);
              } else {
                subsectionArraySortedByZ.splice(i, 1);
              }
            }
          } else if (subsectionArraySortedByZ[i].z === all.length - 3) {
            let localAvg = (all[all.length - 1].y + all[all.length - 2].y + all[all.length - 3].y + all[all.length - 4].y + all[all.length - 5].y + all[all.length - 6].y)/6;
            if (subsectionArraySortedByZ[i].y < localAvg) {
              if (subsectionArraySortedByZ[i].y < subsectionArraySortedByZ[i - 1].y) {
                subsectionArraySortedByZ.splice(i - 1, 1);
              } else {
                subsectionArraySortedByZ.splice(i, 1);
              }
            } else {
              if (subsectionArraySortedByZ[i].y > subsectionArraySortedByZ[i - 1].y) {
                subsectionArraySortedByZ.splice(i - 1, 1);
              } else {
                subsectionArraySortedByZ.splice(i, 1);
              }
            }
          } else if (subsectionArraySortedByZ[i].z === all.length - 4) {
            let localAvg = (all[all.length - 1].y + all[all.length - 2].y + all[all.length - 3].y + all[all.length - 4].y + all[all.length - 5].y + all[all.length - 6].y + all[all.length - 7].y)/7;
            if (subsectionArraySortedByZ[i].y < localAvg) {
              if (subsectionArraySortedByZ[i].y < subsectionArraySortedByZ[i - 1].y) {
                subsectionArraySortedByZ.splice(i - 1, 1);
              } else {
                subsectionArraySortedByZ.splice(i, 1);
              }
            } else {
              if (subsectionArraySortedByZ[i].y > subsectionArraySortedByZ[i - 1].y) {
                subsectionArraySortedByZ.splice(i - 1, 1);
              } else {
                subsectionArraySortedByZ.splice(i, 1);
              }
            }
          } else if (subsectionArraySortedByZ[i].z === all.length - 5) {
            let localAvg = (all[all.length - 1].y + all[all.length - 2].y + all[all.length - 3].y + all[all.length - 4].y + all[all.length - 5].y + all[all.length - 6].y + all[all.length - 7].y + all[all.length - 8].y)/8;
            if (subsectionArraySortedByZ[i].y < localAvg) {
              if (subsectionArraySortedByZ[i].y < subsectionArraySortedByZ[i - 1].y) {
                subsectionArraySortedByZ.splice(i - 1, 1);
              } else {
                subsectionArraySortedByZ.splice(i, 1);
              }
            } else {
              if (subsectionArraySortedByZ[i].y > subsectionArraySortedByZ[i - 1].y) {
                subsectionArraySortedByZ.splice(i - 1, 1);
              } else {
                subsectionArraySortedByZ.splice(i, 1);
              }
            }
          }
        }
      }
    }

    //!!Next, pull in DexScreener!! ...Maaybe lol

    //if point has smaller point behind it and larger point in front of it, set to zero, this is mid-slope noise
    for (let i = 1; i < subsectionArraySortedByZ.length-1; i++) {
      //up slope
      if ((subsectionArraySortedByZ[i-1].y < subsectionArraySortedByZ[i].y) && (subsectionArraySortedByZ[i].y < subsectionArraySortedByZ[i+1].y)) {
        subsectionArraySortedByZ[i].x = '0';
      }
      //down slope
      if ((subsectionArraySortedByZ[i-1].y > subsectionArraySortedByZ[i].y) && (subsectionArraySortedByZ[i].y > subsectionArraySortedByZ[i+1].y)) {
        subsectionArraySortedByZ[i].x = '0';
      }
    }

    for (let i = 0; i < subsectionArraySortedByZ.length; i++) {
      if (subsectionArraySortedByZ[i].x !== '0') {
        peakAndValleyArray.push({x:subsectionArraySortedByZ[i].x, y:subsectionArraySortedByZ[i].y});
      }
    }

    return peakAndValleyArray;
  }

  public generatePredictedEndpointXCoord(): string {
    let blah = new Date(this.indexArr[this.indexArr.length-1]);
    blah.setMonth(blah.getMonth()+2);
    let blahh = this.datepipe.transform(blah, 'YYYY-MM-dd');
    return blahh!.toString();
  }

  public fibonacciFinder(peakAndValleyArray: Array<{x:string, y:number}>): [Array<{x:string, y:number}>, Array<{x:string, y:number}>, boolean] {
    let fibPoints1 = []; //when point is successfully found (near .618 or .382) or initial 100% points
    let fibPoints2 = [];
    let oneHundredPercent = 0;
    let xPercent = 0;
    let fib1 = .618;
    let fib2 = .382;
    let isLatestTrend = false;
    for (let i = 0; i < peakAndValleyArray.length-2; i++) {
      oneHundredPercent = Math.abs(peakAndValleyArray[i].y - peakAndValleyArray[i+1].y);
      xPercent = Math.abs(peakAndValleyArray[i+1].y - peakAndValleyArray[i+2].y);
      let percent = xPercent / oneHundredPercent;
      if (Math.abs(percent - fib1) < .05) {
        //console.log('cool point found1' + ': ' + peakAndValleyArray[i].x +', '+ peakAndValleyArray[i+1].x +', '+peakAndValleyArray[i+2].x);
        fibPoints1.push(peakAndValleyArray[i]);
        fibPoints1.push(peakAndValleyArray[i+1]);
        fibPoints1.push(peakAndValleyArray[i+2]);
        
        if (peakAndValleyArray[i+4].x  === peakAndValleyArray[peakAndValleyArray.length-1].x) {
          isLatestTrend = true;
        }
      } else if (Math.abs(percent - fib2) < .05) {
        //console.log('cool point found2' + ': ' + peakAndValleyArray[i].x +', '+ peakAndValleyArray[i+1].x +', '+peakAndValleyArray[i+2].x);
        fibPoints2.push(peakAndValleyArray[i]);
        fibPoints2.push(peakAndValleyArray[i+1]);
        fibPoints2.push(peakAndValleyArray[i+2]);
        
        if (peakAndValleyArray[i+4].x  === peakAndValleyArray[peakAndValleyArray.length-1].x) {
          isLatestTrend = true;
        }
      }
    }
    return [fibPoints1, fibPoints2, isLatestTrend];
  }

  public bullishCrabFinder(peakAndValleyArray: Array<{x:string, y:number}>): [Array<{x:string, y:number}>, Array<{x:string, y:number}>, boolean, number] {
    let bullishCrabPoints = [];
    let projectedPoints = [];
    let secondPointYCoord = 0;
    let secondPointXCoord = '';
    let isLatestTrend = false;
    let accuracyScore = 0;
    for (let i = 0; i <= peakAndValleyArray.length-5; i++) {
      if (peakAndValleyArray[i].y < peakAndValleyArray[i+1].y && peakAndValleyArray[i+1].y > peakAndValleyArray[i+2].y && peakAndValleyArray[i+2].y > peakAndValleyArray[i].y && 
        peakAndValleyArray[i+2].y < peakAndValleyArray[i+3].y && peakAndValleyArray[i+3].y < peakAndValleyArray[i+1].y && peakAndValleyArray[i+4].y < peakAndValleyArray[i].y) {
          bullishCrabPoints.push(peakAndValleyArray[i]);
          bullishCrabPoints.push(peakAndValleyArray[i+1]);
          bullishCrabPoints.push(peakAndValleyArray[i+2]);
          bullishCrabPoints.push(peakAndValleyArray[i+3]);
          bullishCrabPoints.push(peakAndValleyArray[i+4]);
          projectedPoints.push(peakAndValleyArray[i+4]);
          secondPointXCoord = this.generatePredictedEndpointXCoord();
          secondPointYCoord = (projectedPoints[0].y * 1.04);
          projectedPoints.push({x:secondPointXCoord, y:secondPointYCoord});
          
          if (peakAndValleyArray[i+4].x === peakAndValleyArray[peakAndValleyArray.length-1].x) {
            isLatestTrend = true;
          }
        
          accuracyScore = this.getAccuracyScore(bullishCrabPoints[0].y, bullishCrabPoints[1].y, bullishCrabPoints[2].y, bullishCrabPoints[3].y, bullishCrabPoints[4].y);
      }
    }

    return [bullishCrabPoints, projectedPoints, isLatestTrend, accuracyScore];
  }

  public bearishCrabFinder(peakAndValleyArray: Array<{x:string, y:number}>): [Array<{x:string, y:number}>, Array<{x:string, y:number}>, boolean, number] {
    let bearishCrabPoints = [];
    let projectedPoints = [];
    let secondPointYCoord = 0;
    let secondPointXCoord = '';
    let isLatestTrend = false;
    let accuracyScore = 0;
    for (let i = 0; i <= peakAndValleyArray.length-5; i++) {
      if (peakAndValleyArray[i].y > peakAndValleyArray[i+1].y && peakAndValleyArray[i+1].y < peakAndValleyArray[i+2].y && peakAndValleyArray[i+2].y < peakAndValleyArray[i].y && 
        peakAndValleyArray[i+2].y > peakAndValleyArray[i+3].y && peakAndValleyArray[i+3].y > peakAndValleyArray[i+1].y && peakAndValleyArray[i+4].y > peakAndValleyArray[i].y) {
          bearishCrabPoints.push(peakAndValleyArray[i]);
          bearishCrabPoints.push(peakAndValleyArray[i+1]);
          bearishCrabPoints.push(peakAndValleyArray[i+2]);
          bearishCrabPoints.push(peakAndValleyArray[i+3]);
          bearishCrabPoints.push(peakAndValleyArray[i+4]);
          projectedPoints.push(peakAndValleyArray[i+4]);
          secondPointXCoord = this.generatePredictedEndpointXCoord();
          secondPointYCoord = (projectedPoints[0].y * .96);
          projectedPoints.push({x:secondPointXCoord, y:secondPointYCoord});
          
          if (peakAndValleyArray[i+4].x  === peakAndValleyArray[peakAndValleyArray.length-1].x) {
            isLatestTrend = true;
          }
        
          accuracyScore = this.getAccuracyScore(bearishCrabPoints[0].y, bearishCrabPoints[1].y, bearishCrabPoints[2].y, bearishCrabPoints[3].y, bearishCrabPoints[4].y);
      }
    }
    return [bearishCrabPoints, projectedPoints, isLatestTrend, accuracyScore];
  }

  public bullishSharkFinder(peakAndValleyArray: Array<{x:string, y:number}>): [Array<{x:string, y:number}>, Array<{x:string, y:number}>, boolean, number] {
    let bullishSharkPoints = [];
    let projectedPoints = [];
    let secondPointYCoord = 0;
    let secondPointXCoord = '';
    let isLatestTrend = false;
    let accuracyScore = 0;
    for (let i = 0; i <= peakAndValleyArray.length-5; i++) {
      if (peakAndValleyArray[i].y < peakAndValleyArray[i+1].y && peakAndValleyArray[i+1].y > peakAndValleyArray[i+2].y && peakAndValleyArray[i+2].y > peakAndValleyArray[i].y && 
        peakAndValleyArray[i+3].y > peakAndValleyArray[i+1].y && peakAndValleyArray[i+4].y < peakAndValleyArray[i+2].y) {
          bullishSharkPoints.push(peakAndValleyArray[i]);
          bullishSharkPoints.push(peakAndValleyArray[i+1]);
          bullishSharkPoints.push(peakAndValleyArray[i+2]);
          bullishSharkPoints.push(peakAndValleyArray[i+3]);
          bullishSharkPoints.push(peakAndValleyArray[i+4]);
          projectedPoints.push(peakAndValleyArray[i+4]);
          secondPointXCoord = this.generatePredictedEndpointXCoord();
          secondPointYCoord = (projectedPoints[0].y * 1.04);
          projectedPoints.push({x:secondPointXCoord, y:secondPointYCoord});
          
          if (peakAndValleyArray[i+4].x  === peakAndValleyArray[peakAndValleyArray.length-1].x) {
            isLatestTrend = true;
          }
        
          accuracyScore = this.getAccuracyScore(bullishSharkPoints[0].y, bullishSharkPoints[1].y, bullishSharkPoints[2].y, bullishSharkPoints[3].y, bullishSharkPoints[4].y);
      }
    }
    return [bullishSharkPoints, projectedPoints, isLatestTrend, accuracyScore];
  }

  public bearishSharkFinder(peakAndValleyArray: Array<{x:string, y:number}>): [Array<{x:string, y:number}>, Array<{x:string, y:number}>, boolean, number] {
    let bearishSharkPoints = [];
    let projectedPoints = [];
    let secondPointYCoord = 0;
    let secondPointXCoord = '';
    let isLatestTrend = false;
    let accuracyScore = 0;
    for (let i = 0; i <= peakAndValleyArray.length-5; i++) {
      if (peakAndValleyArray[i].y > peakAndValleyArray[i+1].y && peakAndValleyArray[i+1].y < peakAndValleyArray[i+2].y && peakAndValleyArray[i+2].y < peakAndValleyArray[i].y && 
        peakAndValleyArray[i+3].y < peakAndValleyArray[i+1].y && peakAndValleyArray[i+4].y > peakAndValleyArray[i+2].y) {
          bearishSharkPoints.push(peakAndValleyArray[i]);
          bearishSharkPoints.push(peakAndValleyArray[i+1]);
          bearishSharkPoints.push(peakAndValleyArray[i+2]);
          bearishSharkPoints.push(peakAndValleyArray[i+3]);
          bearishSharkPoints.push(peakAndValleyArray[i+4]);
          projectedPoints.push(peakAndValleyArray[i+4]);
          
          secondPointXCoord = this.generatePredictedEndpointXCoord();//this.indexArr[this.indexArr.length-1];
          secondPointYCoord = (projectedPoints[0].y * 0.96);
          projectedPoints.push({x:secondPointXCoord, y:secondPointYCoord});

          if (peakAndValleyArray[i+4].x  === peakAndValleyArray[peakAndValleyArray.length-1].x) {
            isLatestTrend = true;
          }

          accuracyScore = this.getAccuracyScore(bearishSharkPoints[0].y, bearishSharkPoints[1].y, bearishSharkPoints[2].y, bearishSharkPoints[3].y, bearishSharkPoints[4].y);
      }
    }
    return [bearishSharkPoints, projectedPoints, isLatestTrend, accuracyScore];
  }

  public bullishBatFinder(peakAndValleyArray: Array<{x:string, y:number}>): [Array<{x:string, y:number}>, Array<{x:string, y:number}>, boolean, number] {
    let bullishBatPoints = [];
    let projectedPoints = [];
    let secondPointYCoord = 0;
    let secondPointXCoord = '';
    let isLatestTrend = false;
    let accuracyScore = 0;
    for (let i = 0; i <= peakAndValleyArray.length-5; i++) {
      if (peakAndValleyArray[i].y < peakAndValleyArray[i+1].y && peakAndValleyArray[i+1].y > peakAndValleyArray[i+2].y && peakAndValleyArray[i+2].y > peakAndValleyArray[i].y &&
        peakAndValleyArray[i+2].y < peakAndValleyArray[i+3].y && peakAndValleyArray[i+3].y < peakAndValleyArray[i+1].y && peakAndValleyArray[i+3].y > peakAndValleyArray[i+4].y && peakAndValleyArray[i+4].y > peakAndValleyArray[i].y) {
          bullishBatPoints.push(peakAndValleyArray[i]);
          bullishBatPoints.push(peakAndValleyArray[i+1]);
          bullishBatPoints.push(peakAndValleyArray[i+2]);
          bullishBatPoints.push(peakAndValleyArray[i+3]);
          bullishBatPoints.push(peakAndValleyArray[i+4]);
          projectedPoints.push(peakAndValleyArray[i+4]);
          secondPointXCoord = this.generatePredictedEndpointXCoord();
          secondPointYCoord = (projectedPoints[0].y * 1.04);
          projectedPoints.push({x:secondPointXCoord, y:secondPointYCoord});

          if (peakAndValleyArray[i+4].x  === peakAndValleyArray[peakAndValleyArray.length-1].x) {
            isLatestTrend = true;
          }

          accuracyScore = this.getAccuracyScore(bullishBatPoints[0].y, bullishBatPoints[1].y, bullishBatPoints[2].y, bullishBatPoints[3].y, bullishBatPoints[4].y);
      }
    }
    return [bullishBatPoints, projectedPoints, isLatestTrend, accuracyScore];
  }

  public bearishBatFinder(peakAndValleyArray: Array<{x:string, y:number}>): [Array<{x:string, y:number}>, Array<{x:string, y:number}>, boolean, number] {
    let bearishBatPoints = [];
    let projectedPoints = [];
    let secondPointYCoord = 0;
    let secondPointXCoord = '';
    let isLatestTrend = false;
    let accuracyScore = 0;
    for (let i = 0; i <= peakAndValleyArray.length-5; i++) {
      if (peakAndValleyArray[i].y > peakAndValleyArray[i+1].y && peakAndValleyArray[i+1].y < peakAndValleyArray[i+2].y && peakAndValleyArray[i+2].y < peakAndValleyArray[i].y && peakAndValleyArray[i+2].y > peakAndValleyArray[i+3].y &&
        peakAndValleyArray[i+3].y > peakAndValleyArray[i+1].y && peakAndValleyArray[i+3].y < peakAndValleyArray[i+4].y && peakAndValleyArray[i+4].y < peakAndValleyArray[i].y) {
          bearishBatPoints.push(peakAndValleyArray[i]);
          bearishBatPoints.push(peakAndValleyArray[i+1]);
          bearishBatPoints.push(peakAndValleyArray[i+2]);
          bearishBatPoints.push(peakAndValleyArray[i+3]);
          bearishBatPoints.push(peakAndValleyArray[i+4]);
          projectedPoints.push(peakAndValleyArray[i+4]);
          secondPointXCoord = this.generatePredictedEndpointXCoord();
          secondPointYCoord = (projectedPoints[0].y * .96);
          projectedPoints.push({x:secondPointXCoord, y:secondPointYCoord});
          
          if (peakAndValleyArray[i+4].x  === peakAndValleyArray[peakAndValleyArray.length-1].x) {
            isLatestTrend = true;
          }

          accuracyScore = this.getAccuracyScore(bearishBatPoints[0].y, bearishBatPoints[1].y, bearishBatPoints[2].y, bearishBatPoints[3].y, bearishBatPoints[4].y);
      }
    }
    return [bearishBatPoints, projectedPoints, isLatestTrend, accuracyScore];
  } 

  getAccuracyScore(a: number, b: number, c: number, d: number, e: number): number {
    //now capture how similar to desired ratio I am. If desired ratio is a range and you're in it, return 100% for that piece.  
    let line0 = Math.abs(a - b);
    let line1 = Math.abs(b - c);
    let line2 = Math.abs(c - d);
    let line3 = Math.abs(d - e);
    let ratio1 = line1 / line0;
    let ratio1Rating = 0;
    let ratio2 = line2 / line1;
    let ratio2Rating = 0;
    let ratio3 = line3 / line2;
    let ratio3Rating = 0;
    if (ratio1 > .382 && ratio1 < .618) {
      ratio1Rating = 1;
    } else if (ratio1 < .382) {
      ratio1Rating = ratio1 / .382;
    } else if (ratio1 > .618) {
      ratio1Rating = .618 / ratio1;
    }
    if (ratio2 > .382 && ratio2 < .886) {
      ratio2Rating = 1;
    } else if (ratio2 < .382) {
      ratio2Rating = ratio2 / .382;
    } else if (ratio2 > .886) {
      ratio2Rating = .886 / ratio2;
    }
    if (ratio3 > 1.618) {
      ratio3Rating = 1.618 / ratio3;
    } else if (ratio3 < 1.618) {
      ratio3Rating = ratio3 / 1.618;
    } else (ratio3Rating = 1)
    let finalScore = (ratio1Rating + ratio2Rating + ratio3Rating) / 3;
    return finalScore;
  }
}
// TODO: Google how much stock is supposed to rise/fall with these algs